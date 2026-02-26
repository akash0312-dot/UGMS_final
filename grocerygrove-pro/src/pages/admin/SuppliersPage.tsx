import { useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Agency } from "@/data/mockData";

const emptyAgency: Omit<Agency, "id"> = { name: "", contactPerson: "", phone: "", email: "", address: "", productsSupplied: [] };

const SuppliersPage = () => {
  const { agencies, addAgency, updateAgency, deleteAgency } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState<Omit<Agency, "id">>(emptyAgency);
  const [productsStr, setProductsStr] = useState("");

  const openAdd = () => { setEditing(null); setForm(emptyAgency); setProductsStr(""); setOpen(true); };
  const openEdit = (a: Agency) => { setEditing(a); setForm({ name: a.name, contactPerson: a.contactPerson, phone: a.phone, email: a.email, address: a.address, productsSupplied: a.productsSupplied }); setProductsStr(a.productsSupplied.join(", ")); setOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error("Agency name is required"); return; }
    const data = { ...form, productsSupplied: productsStr.split(",").map((s) => s.trim()).filter(Boolean) };
    if (editing) {
      updateAgency(editing.id, data);
      toast.success("Supplier updated");
    } else {
      addAgency({ ...data, id: "A" + String(agencies.length + 1).padStart(3, "0") });
      toast.success("Supplier added");
    }
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Manage supplier and agency information</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agencies.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card shadow-card border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display font-bold">{a.name}</h3>
                <p className="text-sm text-muted-foreground">{a.id}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { deleteAgency(a.id); toast.success("Removed"); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Contact:</span> {a.contactPerson}</p>
              <p><span className="text-muted-foreground">Phone:</span> {a.phone}</p>
              <p><span className="text-muted-foreground">Email:</span> {a.email}</p>
              <p><span className="text-muted-foreground">Address:</span> {a.address}</p>
              <p><span className="text-muted-foreground">Products:</span> {a.productsSupplied.join(", ")}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1"><Label>Agency Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Products Supplied (comma-separated)</Label><Input value={productsStr} onChange={(e) => setProductsStr(e.target.value)} /></div>
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

export default SuppliersPage;
