import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Users, Package, AlertTriangle, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { dailySales } from "@/data/mockData";

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

  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const totalAttendance = workers.length > 0
    ? Math.round(workers.reduce((s, w) => s + (w.daysPresent / (w.daysPresent + w.daysAbsent)) * 100, 0) / workers.length)
    : 0;
  const todaySales = dailySales[dailySales.length - 1];
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
        <StatCard icon={ShoppingCart} label="Today's Bills" value={String(todaySales.billCount)} sub={`₹${todaySales.totalAmount.toLocaleString()}`} color="gradient-accent" />
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
                    {supplier && <p className="text-xs text-muted-foreground">Order from: {supplier.name}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Sales */}
      <div className="rounded-xl bg-card shadow-card border border-border p-5">
        <h2 className="font-display font-bold mb-4">Recent Daily Sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left py-2">Date</th><th className="text-right py-2">Bills</th><th className="text-right py-2">Amount</th><th className="text-left py-2 pl-4">Top Products</th></tr></thead>
            <tbody>
              {dailySales.map((s) => (
                <tr key={s.date} className="border-b border-border/50">
                  <td className="py-2.5">{s.date}</td>
                  <td className="text-right">{s.billCount}</td>
                  <td className="text-right font-medium text-primary">₹{s.totalAmount.toLocaleString()}</td>
                  <td className="pl-4 text-muted-foreground">{s.topProducts.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
