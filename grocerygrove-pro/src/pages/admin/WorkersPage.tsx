import { useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Worker } from "@/data/mockData";

const emptyWorker: Omit<Worker, "id"> = { name: "", position: "", experience: 0, salary: 0, phone: "", email: "", daysPresent: 0, daysAbsent: 0 };

const WorkersPage = () => {
  const { workers, addWorker, updateWorker, deleteWorker } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<Omit<Worker, "id">>(emptyWorker);

  const totalPresent = workers.reduce((s, w) => s + w.daysPresent, 0);
  const totalAbsent = workers.reduce((s, w) => s + w.daysAbsent, 0);
  const attendancePct = totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

  const openAdd = () => { setEditing(null); setForm(emptyWorker); setOpen(true); };
  const openEdit = (w: Worker) => { setEditing(w); setForm({ name: w.name, position: w.position, experience: w.experience, salary: w.salary, phone: w.phone, email: w.email, daysPresent: w.daysPresent, daysAbsent: w.daysAbsent }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.position) { toast.error("Name and position are required"); return; }
    if (editing) {
      updateWorker(editing.id, form);
      toast.success("Worker updated");
    } else {
      addWorker({ ...form, id: "W" + String(workers.length + 1).padStart(3, "0") });
      toast.success("Worker added");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => { deleteWorker(id); toast.success("Worker removed"); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Workers</h1>
          <p className="text-muted-foreground text-sm">Manage staff and track attendance</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Worker</Button>
      </div>

      {/* Summary */}
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

      {/* Table */}
      <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Name</th><th className="text-left p-3">Position</th><th className="text-right p-3">Exp (yr)</th><th className="text-right p-3">Salary</th><th className="text-center p-3">Present</th><th className="text-center p-3">Absent</th><th className="text-right p-3">Actions</th></tr>
            </thead>
            <tbody>
              {workers.map((w, i) => (
                <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-muted-foreground">{w.id}</td>
                  <td className="p-3 font-medium">{w.name}</td>
                  <td className="p-3">{w.position}</td>
                  <td className="p-3 text-right">{w.experience}</td>
                  <td className="p-3 text-right">₹{w.salary.toLocaleString()}</td>
                  <td className="p-3 text-center text-success">{w.daysPresent}</td>
                  <td className="p-3 text-center text-destructive">{w.daysAbsent}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(w)}><Edit className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(w.id)}><Trash2 className="h-3 w-3" /></Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Worker" : "Add Worker"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div className="space-y-1"><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: +e.target.value })} /></div>
            <div className="space-y-1"><Label>Salary</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Days Present</Label><Input type="number" value={form.daysPresent} onChange={(e) => setForm({ ...form, daysPresent: +e.target.value })} /></div>
            <div className="space-y-1"><Label>Days Absent</Label><Input type="number" value={form.daysAbsent} onChange={(e) => setForm({ ...form, daysAbsent: +e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkersPage;
