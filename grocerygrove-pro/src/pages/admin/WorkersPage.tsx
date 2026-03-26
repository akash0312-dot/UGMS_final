import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  displayWorkerCategory,
  partitionStandardAndCustomCategories,
  sortWorkerCategories,
} from "@/lib/workerCategories";
import { toast } from "sonner";
import type { Worker } from "@/data/mockData";
import {
  API_BASE,
  createWorkerCategoryInApi,
  createWorkerInApi,
  deleteWorkerInApi,
  fetchWorkerCategoriesFromApi,
  fetchWorkersFromApi,
  formatApiNetworkError,
  updateWorkerInApi,
  type ApiWorkerCategory,
} from "@/lib/api";

type WorkerFormFields = {
  workerCode: string;
  password: string;
  name: string;
  experience: number;
  salary: number;
  phone: string;
  email: string;
  daysPresent: number;
  daysAbsent: number;
  categoryId: string;
};

const emptyForm = (): WorkerFormFields => ({
  workerCode: "",
  password: "",
  name: "",
  experience: 0,
  salary: 0,
  phone: "",
  email: "",
  daysPresent: 0,
  daysAbsent: 0,
  categoryId: "",
});

const WorkersPage = () => {
  const { workers, setWorkers } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<WorkerFormFields>(emptyForm);
  const [categories, setCategories] = useState<ApiWorkerCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoriesError(null);
    try {
      const cats = await fetchWorkerCategoriesFromApi();
      setCategories(sortWorkerCategories(cats));
    } catch (err: unknown) {
      const message = formatApiNetworkError(err);
      setCategoriesError(message);
      toast.error(`Categories: ${message}`);
    }
  }, []);

  const { standard: standardCategories, custom: customCategories } = useMemo(
    () => partitionStandardAndCustomCategories(categories),
    [categories],
  );

  useEffect(() => {
    const load = async () => {
      await loadCategories();
      try {
        const apiWorkers = await fetchWorkersFromApi();
        setWorkers(apiWorkers);
      } catch (err: unknown) {
        console.error(err);
        toast.error(`Workers: ${formatApiNetworkError(err)}`);
      }
    };
    void load();
  }, [setWorkers, loadCategories]);

  const resolveCategoryIdForWorker = (w: Worker, cats: ApiWorkerCategory[]): string => {
    if (w.categoryId != null) return String(w.categoryId);
    const byName = cats.find(
      (c) => w.categoryName && c.name.toLowerCase() === w.categoryName.toLowerCase(),
    );
    return byName ? String(byName.id) : "";
  };

  const totalPresent = workers.reduce((s, w) => s + w.daysPresent, 0);
  const totalAbsent = workers.reduce((s, w) => s + w.daysAbsent, 0);
  const attendancePct =
    totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setNewCategoryName("");
    setAddingCategory(false);
    setOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setForm({
      workerCode: w.id,
      password: "",
      name: w.name,
      experience: w.experience,
      salary: w.salary,
      phone: w.phone,
      email: w.email,
      daysPresent: w.daysPresent,
      daysAbsent: w.daysAbsent,
      categoryId: resolveCategoryIdForWorker(w, categories),
    });
    setNewCategoryName("");
    setAddingCategory(false);
    setOpen(true);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Enter a category name");
      return;
    }
    try {
      const created = await createWorkerCategoryInApi(name);
      setCategories(sortWorkerCategories([...categories, created]));
      setForm((f) => ({ ...f, categoryId: String(created.id) }));
      setNewCategoryName("");
      setAddingCategory(false);
      toast.success("Category added");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add category";
      toast.error(message);
    }
  };

  const handleSave = async () => {
    const categoryIdNum = Number(form.categoryId);
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.categoryId || Number.isNaN(categoryIdNum)) {
      toast.error("Select a worker category");
      return;
    }

    const cat = categories.find((c) => c.id === categoryIdNum);
    const roleLabel = cat?.name ?? "";

    if (editing) {
      try {
        await updateWorkerInApi(editing.id, {
          name: form.name.trim(),
          position: roleLabel,
          categoryId: categoryIdNum,
          experience: form.experience,
          salary: form.salary,
          phone: form.phone,
          daysPresent: form.daysPresent,
          daysAbsent: form.daysAbsent,
          password: form.password.trim() || undefined,
        });
        const apiWorkers = await fetchWorkersFromApi();
        setWorkers(apiWorkers);
        toast.success("Worker updated");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update worker";
        toast.error(message);
        return;
      }
    } else {
      const code = form.workerCode.trim();
      if (!code) {
        toast.error("Staff ID is required");
        return;
      }
      if (!form.password || form.password.length < 6) {
        toast.error("Password is required (at least 6 characters)");
        return;
      }
      try {
        await createWorkerInApi({
          workerCode: code,
          password: form.password,
          categoryId: categoryIdNum,
          name: form.name.trim(),
          position: roleLabel,
          experience: form.experience,
          salary: form.salary,
          phone: form.phone,
          daysPresent: form.daysPresent,
          daysAbsent: form.daysAbsent,
        });
        const apiWorkers = await fetchWorkersFromApi();
        setWorkers(apiWorkers);
        toast.success("Worker added");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to add worker";
        toast.error(message);
        return;
      }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkerInApi(id);
      const apiWorkers = await fetchWorkersFromApi();
      setWorkers(apiWorkers);
      toast.success("Worker removed");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove worker";
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Workers</h1>
          <p className="text-muted-foreground text-sm">Manage staff categories, IDs, and login passwords</p>
          {categoriesError && (
            <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">Could not load role categories</p>
              <p className="text-destructive/90 mt-1">{categoriesError}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                API base: {API_BASE === "" ? "same as this page (dev proxy → port 5000)" : API_BASE}
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void loadCategories()}>
                Retry categories
              </Button>
            </div>
          )}
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Worker
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold">{workers.length}</p>
          <p className="text-xs text-muted-foreground">Total Workers</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold">{workers.length}</p>
          <p className="text-xs text-muted-foreground">Active Workers</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{attendancePct}%</p>
          <p className="text-xs text-muted-foreground">Avg Attendance</p>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3">Staff ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Exp (yr)</th>
                <th className="text-right p-3">Salary</th>
                <th className="text-center p-3">Login</th>
                <th className="text-center p-3">Present</th>
                <th className="text-center p-3">Absent</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, i) => (
                <motion.tr
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-border/50 hover:bg-secondary/30"
                >
                  <td className="p-3 text-muted-foreground font-mono">{w.id}</td>
                  <td className="p-3 font-medium">{w.name}</td>
                  <td className="p-3">
                    {w.categoryName ? displayWorkerCategory(w.categoryName) : w.position || "—"}
                  </td>
                  <td className="p-3 text-right">{w.experience}</td>
                  <td className="p-3 text-right">₹{w.salary.toLocaleString()}</td>
                  <td className="p-3 text-center text-xs">
                    {w.hasPassword === false ? (
                      <span className="text-amber-600 dark:text-amber-500">Set password</span>
                    ) : (
                      <span className="text-success">Ready</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-success">{w.daysPresent}</td>
                  <td className="p-3 text-center text-destructive">{w.daysAbsent}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(w)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(w.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Worker" : "Add Worker"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <p className="col-span-2 text-sm text-muted-foreground border-b border-border pb-2">
              Each worker gets a unique <strong className="text-foreground">Staff ID</strong> and{" "}
              <strong className="text-foreground">password</strong> for the worker login screen. Choose a{" "}
              <strong className="text-foreground">role</strong> from the list or add a new category.
            </p>
            {!editing && (
              <div className="space-y-1 col-span-2">
                <Label>Staff ID (individual login ID)</Label>
                <Input
                  className="font-mono"
                  placeholder="e.g. W010, HR-001, DL-204"
                  value={form.workerCode}
                  onChange={(e) => setForm({ ...form, workerCode: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique. Workers sign in with this ID and their password.
                </p>
              </div>
            )}
            {editing && (
              <div className="space-y-1 col-span-2">
                <Label>Staff ID</Label>
                <Input className="font-mono bg-muted/50" value={form.workerCode} readOnly />
              </div>
            )}
            {!editing && (
              <div className="space-y-1 col-span-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Private to this worker; can be changed later when editing.</p>
              </div>
            )}
            {editing && (
              <div className="space-y-1 col-span-2">
                <Label>New password (optional)</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1 col-span-2">
              <div className="flex items-end justify-between gap-2 flex-wrap">
                <Label className="block">Role category</Label>
                <Button type="button" variant="ghost" size="sm" className="h-8 -mb-1" onClick={() => setAddingCategory((v) => !v)}>
                  {addingCategory ? "Close" : "+ Add category"}
                </Button>
              </div>
              <Select value={form.categoryId || undefined} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select HR, picker, accountant…" />
                </SelectTrigger>
                <SelectContent>
                  {standardCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Standard roles</SelectLabel>
                      {standardCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {displayWorkerCategory(c.name)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {customCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Custom categories</SelectLabel>
                      {customCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {displayWorkerCategory(c.name)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              {addingCategory && (
                <div className="flex flex-col gap-1 mt-2">
                  <Input
                    placeholder="New category (e.g. Night supervisor)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleAddCategory();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" className="self-start" onClick={() => void handleAddCategory()}>
                    Save category
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Experience (years)</Label>
              <Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: +e.target.value })} />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Salary</Label>
              <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()}>{editing ? "Update" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkersPage;
