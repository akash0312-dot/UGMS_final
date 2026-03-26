import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Users, Package, AlertTriangle, DollarSign, TrendingUp, ShoppingCart, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAdminMessagesInApi } from "@/lib/api";

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card border border-border p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-display font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" style={{ color: "hsl(0, 0%, 100%)" }} />
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const workers = useStore((s) => s.workers);
  const products = useStore((s) => s.products);
  const invoices = useStore((s) => s.invoices);
  const agencies = useStore((s) => s.agencies);
  
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  useEffect(() => {
    fetchAdminMessagesInApi().then(msgs => setRecentMessages(msgs.slice(0, 3))).catch(console.error);
  }, []);

  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const totalAttendance = workers.length > 0
    ? Math.round(workers.reduce((s, w) => s + (w.daysPresent / (w.daysPresent + w.daysAbsent)) * 100, 0) / workers.length)
    : 0;
  const today = new Date().toLocaleDateString();
  const todaysInvoices = invoices.filter(inv => inv.date.startsWith(today));
  const todaysTotal = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const totalProfit = invoices.reduce((sum, inv) => sum + (inv.profit ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your grocery store operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Workers" value={String(workers.length)} sub={`${totalAttendance}% avg attendance`} color="gradient-primary" />
        <StatCard icon={Package} label="Total Products" value={String(products.length)} sub={`${lowStock.length} low stock`} color="bg-info" />
        <StatCard icon={ShoppingCart} label="Today's Bills" value={String(todaysInvoices.length)} sub={`₹${todaysTotal.toLocaleString()}`} color="gradient-accent" />
        <StatCard icon={TrendingUp} label="Total Profit" value={`₹${totalProfit.toLocaleString()}`} sub="Accumulated from all bills" color="bg-success" />
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display font-bold text-destructive">Low Stock Alerts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((p) => {
              const supplier = agencies.find((a) => p.agencyIds.includes(a.id));
              return (
                <div key={p.id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                  <span className="text-2xl">{p.image}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-destructive font-medium">Stock: {p.stock} (min: {p.minStock})</p>
                    {supplier && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Order from: <span className="font-semibold">{supplier.name}</span>
                        <br />
                        Phone: <span className="text-foreground">{supplier.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Messages Widget */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border bg-card p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-indigo-500" />
              <h2 className="font-display font-bold">Recent Messages</h2>
          </div>
          {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent messages.</p>
          ) : (
              <div className="space-y-3">
                  {recentMessages.map(m => (
                      <div key={m.id} className="p-3 bg-slate-50 rounded-lg flex flex-col gap-1 border">
                          <div className="flex justify-between items-center w-full">
                              <span className="font-semibold text-sm">{m.sender_name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 truncate">{m.content}</p>
                      </div>
                  ))}
              </div>
          )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
