import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Plus, Minus, Trash2, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchProductsFromApi, createOrderInApi } from "@/lib/api";

const categories = ["All", "Grains", "Pulses", "Oils", "Essentials", "Beverages", "Dairy", "Bakery", "Vegetables"];

const ShopPage = () => {
  const navigate = useNavigate();
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, addInvoice, setRole, setProducts } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [showInvoice, setShowInvoice] = useState<null | ReturnType<typeof generateInvoice>>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const apiProducts = await fetchProductsFromApi();
        setProducts(apiProducts);
      } catch (err: any) {
        // If backend is not ready, keep UI usable with a toast
        toast.error(err.message || "Failed to load products from server");
      }
    })();
  }, [setProducts]);

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  function generateInvoice() {
    const profit = cart.reduce(
      (sum, c) => sum + (c.product.price - (c.product.costPrice ?? 0)) * c.quantity,
      0
    );
    const inv = {
      id: "INV-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toLocaleString(),
      items: cart.map((c) => ({ name: c.product.name, quantity: c.quantity, price: c.product.price })),
      subtotal: cartTotal,
      gst: Math.round(cartTotal * 0.05),
      total: Math.round(cartTotal * 1.05),
      profit: Math.round(profit),
    };
    return inv;
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (isPlacingOrder) return;

    // Check stock
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.product.id);
      if (!prod || prod.stock < item.quantity) {
        toast.error(`Insufficient stock for ${item.product.name}`);
        return;
      }
    }
    try {
      setIsPlacingOrder(true);
      await createOrderInApi(
        cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        }))
      );

      const inv = generateInvoice();
      addInvoice(inv);
      setShowInvoice(inv);
      clearCart();
      setShowCart(false);
      toast.success("Order placed successfully!");

      // Refresh products from backend to reflect new stock levels
      try {
        const apiProducts = await fetchProductsFromApi();
        setProducts(apiProducts);
      } catch {
        // Non-fatal if refresh fails
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setRole("none"); navigate("/"); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-bold">UGMS Shop</h1>
          </div>
          <Button variant="outline" className="relative" onClick={() => setShowCart(!showCart)}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "secondary"} size="sm" onClick={() => setCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product, i) => {
            const inCart = cart.find((c) => c.product.id === product.id);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card shadow-card p-4 flex flex-col"
              >
                <div className="text-5xl text-center mb-3">{product.image}</div>
                <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="font-bold text-primary">₹{product.price}</span>
                  <span className={`text-xs ${product.stock <= product.minStock ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCartQuantity(product.id, inCart.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-medium text-sm w-6 text-center">{inCart.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                      if (inCart.quantity >= product.stock) { toast.error("Max stock reached"); return; }
                      updateCartQuantity(product.id, inCart.quantity + 1);
                    }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 ml-auto" onClick={() => removeFromCart(product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" className="mt-3 w-full" onClick={() => { if (product.stock === 0) { toast.error("Out of stock"); return; } addToCart(product); }} disabled={product.stock === 0}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 border-l border-border shadow-elevated flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-display font-bold">Shopping Cart</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>Close</Button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cart.length === 0 && <p className="text-muted-foreground text-center py-8">Your cart is empty</p>}
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <span className="text-2xl">{item.product.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.product.price} × {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">₹{item.product.price * item.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                  <div className="flex justify-between text-sm"><span>GST (5%)</span><span>₹{Math.round(cartTotal * 0.05)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">₹{Math.round(cartTotal * 1.05)}</span></div>
                  <Button className="w-full" onClick={handleCheckout} disabled={isPlacingOrder}>
                    {isPlacingOrder ? "Placing order..." : "Checkout & Generate Invoice"}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/30 z-50" onClick={() => setShowInvoice(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full bg-card rounded-2xl z-50 shadow-elevated overflow-auto max-h-[90vh] p-6"
            >
              <div className="text-center mb-6">
                <Store className="h-8 w-8 text-primary mx-auto mb-2" />
                <h2 className="text-xl font-display font-bold">UGMS Invoice</h2>
                <p className="text-sm text-muted-foreground">{showInvoice.id} • {showInvoice.date}</p>
              </div>
              <table className="w-full text-sm mb-4">
                <thead><tr className="border-b border-border"><th className="text-left py-2">Item</th><th className="text-center py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
                <tbody>
                  {showInvoice.items.map((item, i) => (
                    <tr key={i} className="border-b border-border/50"><td className="py-2">{item.name}</td><td className="text-center">{item.quantity}</td><td className="text-right">₹{item.price}</td><td className="text-right font-medium">₹{item.price * item.quantity}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{showInvoice.subtotal}</span></div>
                <div className="flex justify-between"><span>GST (5%)</span><span>₹{showInvoice.gst}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span className="text-primary">₹{showInvoice.total}</span></div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => { window.print(); }}>Print</Button>
                <Button className="flex-1" onClick={() => setShowInvoice(null)}>Done</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPage;
