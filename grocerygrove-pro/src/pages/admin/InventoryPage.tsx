import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchProductsFromApi, createProductInApi, createSupplierInApi, restockProductInApi, updateProductInApi } from "@/lib/api";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const InventoryPage = () => {
  const products = useStore((s) => s.products);
  const agencies = useStore((s) => s.agencies);
  const setProducts = useStore((s) => s.setProducts);

  useEffect(() => {
    (async () => {
      try {
        const apiProducts = await fetchProductsFromApi();
        setProducts(apiProducts);
      } catch (err: any) {
        toast.error(err.message || "Failed to load products from server");
      }
    })();
  }, [setProducts]);

  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const existingCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Add product dialog
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newMinStock, setNewMinStock] = useState("");
  const [newImage, setNewImage] = useState("📦");
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyContact, setNewAgencyContact] = useState("");
  const [newAgencyPhone, setNewAgencyPhone] = useState("");
  const [newAgencyEmail, setNewAgencyEmail] = useState("");
  const [newAgencyAddress, setNewAgencyAddress] = useState("");

  // Restock dialog
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockId, setRestockId] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");

  const resetAddForm = () => {
    setEditId(null);
    setNewName(""); setNewCategory(""); setIsNewCategory(false); setNewPrice(""); setNewCostPrice(""); setNewStock("");
    setNewMinStock(""); setNewImage("📦"); setSupplierMode("existing");
    setSelectedAgency(""); setNewAgencyName(""); setNewAgencyContact("");
    setNewAgencyPhone(""); setNewAgencyEmail(""); setNewAgencyAddress("");
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setNewName(p.name);
    setNewCategory(p.category);
    setIsNewCategory(!existingCategories.includes(p.category));
    setNewPrice(String(p.price));
    setNewCostPrice(String(p.costPrice));
    setNewStock(String(p.stock));
    setNewMinStock(String(p.minStock));
    setNewImage(p.image);
    setAddOpen(true);
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice || !newCostPrice || !newStock) {
      toast.error("Please fill name, selling price, cost price and stock");
      return;
    }

    let supplierId: string | undefined = undefined;
    if (supplierMode === "existing" && selectedAgency) {
      supplierId = selectedAgency;
    }

    if (supplierMode === "new") {
      if (!newAgencyName || !newAgencyPhone) {
        toast.error("Please fill supplier name and phone");
        return;
      }
      try {
        const created = await createSupplierInApi({
          name: newAgencyName,
          contactPerson: newAgencyContact,
          phone: newAgencyPhone,
          email: newAgencyEmail,
          address: newAgencyAddress,
        });
        supplierId = created.id;
      } catch (err: any) {
        toast.error(err.message || "Failed to create supplier");
        return;
      }
    }

    try {
      if (editId) {
        await updateProductInApi(editId, {
          name: newName,
          category: newCategory || "General",
          sale_price: Number(newPrice),
          stock_qty: Number(newStock),
          min_threshold: Number(newMinStock) || 5,
          image_url: newImage,
          cost_price: Number(newCostPrice),
        });
        toast.success(`Product "${newName}" updated!`);
      } else {
        await createProductInApi({
          name: newName,
          category: newCategory || "General",
          sale_price: Number(newPrice),
          stock_qty: Number(newStock),
          min_threshold: Number(newMinStock) || 5,
          image_url: newImage,
          cost_price: Number(newCostPrice),
          supplier_id: supplierId ? Number(supplierId) : undefined,
        });
        toast.success(`Product "${newName}" added!`);
      }

      const apiProducts = await fetchProductsFromApi();
      setProducts(apiProducts);

      resetAddForm();
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add/update product");
    }
  };

  const handleRestock = async () => {
    if (!restockId || !restockQty || Number(restockQty) <= 0 || !restockCost) {
      toast.error("Enter a valid quantity and cost price");
      return;
    }
    try {
      await restockProductInApi(restockId, Number(restockQty), Number(restockCost));
      const apiProducts = await fetchProductsFromApi();
      setProducts(apiProducts);
      toast.success("Stock updated!");
      setRestockOpen(false);
      setRestockQty(""); setRestockCost("");
      setRestockId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to restock product");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">Monitor stock levels and manage products</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button variant="outline" onClick={() => setRestockOpen(true)} className="gap-2">
            <PackagePlus className="h-4 w-4" /> Restock
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display font-bold text-destructive">Low Stock Alerts ({lowStock.length})</h2>
          </div>
          <div className="space-y-2">
            {lowStock.map((p) => {
              const supplier = agencies.find((a) => p.agencyIds.includes(a.id));
              return (
                <div key={p.id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                  <span className="text-2xl">{p.image}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-destructive">Current: {p.stock} | Minimum: {p.minStock}</p>
                  </div>
                  {supplier && (
                    <div className="text-right">
                      <p className="text-xs font-medium">Recommended Supplier:</p>
                      <p className="text-xs text-primary">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setRestockId(p.id); setRestockOpen(true); }}>
                    Restock
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Full inventory table */}
      <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Sell Price</th>
                <th className="text-right p-3">Cost Price</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-right p-3">Min Stock</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-muted-foreground">{p.id}</td>
                  <td className="p-3"><span className="mr-2">{p.image}</span>{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-right">₹{p.price}</td>
                  <td className="p-3 text-right text-muted-foreground">₹{p.costPrice}</td>
                  <td className="p-3 text-right font-medium">{p.stock}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.minStock}</td>
                  <td className="p-3">
                    {p.stock <= p.minStock ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">Low Stock</span>
                    ) : p.stock <= p.minStock * 2 ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground">Warning</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">In Stock</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRestockId(p.id); setRestockOpen(true); }}>
                      Restock
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        if (!open) resetAddForm();
        setAddOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>Fill in the product details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Product Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Basmati Rice" />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                {isNewCategory ? (
                  <div className="flex gap-2">
                    <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Grains" className="flex-1" />
                    <Button type="button" variant="outline" size="icon" onClick={() => { setIsNewCategory(false); setNewCategory(existingCategories[0] || "General"); }}>✕</Button>
                  </div>
                ) : (
                  <Select value={newCategory} onValueChange={(val) => {
                    if (val === '__new__') {
                      setIsNewCategory(true);
                      setNewCategory("");
                    } else {
                      setNewCategory(val);
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {existingCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="__new__" className="text-primary font-medium">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Selling Price (₹) *</Label>
                <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Purchase Cost (₹) *</Label>
                <Input type="number" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Stock Qty *</Label>
                <Input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Min Stock</Label>
                <Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="5" />
              </div>
            </div>
            <div className="space-y-1 flex flex-col items-start gap-2">
              <Label>Emoji Icon</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-12 w-16 text-2xl p-0">{newImage}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none bg-transparent" align="start">
                  <EmojiPicker onEmojiClick={(data) => setNewImage(data.emoji)} />
                </PopoverContent>
              </Popover>
            </div>

            {!editId && <div className="border-t border-border pt-4">
              <Label className="text-base font-semibold">Supplier Details</Label>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant={supplierMode === "existing" ? "default" : "outline"} onClick={() => setSupplierMode("existing")}>Existing Supplier</Button>
                <Button size="sm" variant={supplierMode === "new" ? "default" : "outline"} onClick={() => setSupplierMode("new")}>New Supplier</Button>
              </div>

              {supplierMode === "existing" ? (
                <div className="mt-3">
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                    <SelectContent>
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Supplier Name *</Label>
                      <Input value={newAgencyName} onChange={(e) => setNewAgencyName(e.target.value)} placeholder="Agency name" />
                    </div>
                    <div className="space-y-1">
                      <Label>Contact Person</Label>
                      <Input value={newAgencyContact} onChange={(e) => setNewAgencyContact(e.target.value)} placeholder="Contact name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Phone *</Label>
                      <Input value={newAgencyPhone} onChange={(e) => setNewAgencyPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input value={newAgencyEmail} onChange={(e) => setNewAgencyEmail(e.target.value)} placeholder="Email" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input value={newAgencyAddress} onChange={(e) => setNewAgencyAddress(e.target.value)} placeholder="Address" />
                  </div>
                </div>
              )}
            </div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetAddForm(); setAddOpen(false); }}>Cancel</Button>
            <Button onClick={handleAddProduct}>{editId ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>Select a product and enter the quantity to add.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={restockId} onValueChange={setRestockId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.image} {p.name} (Current: {p.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantity to Add</Label>
              <Input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity" />
            </div>
            <div className="space-y-1">
              <Label>Purchase Cost per Unit (₹)</Label>
              <Input type="number" value={restockCost} onChange={(e) => setRestockCost(e.target.value)} placeholder="Enter cost price" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>Cancel</Button>
            <Button onClick={handleRestock}>Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
