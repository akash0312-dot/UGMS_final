import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";

const DailyReportPage = () => {
  const invoices = useStore((s) => s.invoices);

  const dailySales = useMemo(() => {
    const map = new Map<string, { date: string; totalAmount: number; billCount: number; profit: number; productCounts: Record<string, number> }>();

    // Process all invoices
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedInvoices.forEach(inv => {
      // Split date to get the day string appropriately
      const dateStr = inv.date.split(',')[0];
      if (!map.has(dateStr)) {
        map.set(dateStr, { date: dateStr, totalAmount: 0, billCount: 0, profit: 0, productCounts: {} });
      }
      const day = map.get(dateStr)!;
      day.totalAmount += inv.total;
      day.billCount++;
      day.profit += inv.profit || 0;

      inv.items.forEach(item => {
        day.productCounts[item.name] = (day.productCounts[item.name] || 0) + item.quantity;
      });
    });

    return Array.from(map.values()).map(day => {
      const topProducts = Object.entries(day.productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(e => e[0]);

      return {
        date: day.date,
        totalAmount: day.totalAmount,
        billCount: day.billCount,
        profit: day.profit,
        topProducts
      };
    });
  }, [invoices]);

  const total = dailySales.reduce((s, d) => s + d.totalAmount, 0);
  const totalBills = dailySales.reduce((s, d) => s + d.billCount, 0);
  const totalProfit = dailySales.reduce((s, d) => s + d.profit, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Daily Sales Report</h1>
        <p className="text-muted-foreground text-sm">Track daily revenue and billing activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">₹{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Sales</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold text-success">₹{totalProfit.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Profit</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold">{totalBills}</p>
          <p className="text-xs text-muted-foreground">Total Bills</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
          <p className="text-2xl font-display font-bold">₹{totalBills > 0 ? Math.round(total / totalBills).toLocaleString() : 0}</p>
          <p className="text-xs text-muted-foreground">Avg Bill Value</p>
        </div>
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border p-5">
        <h2 className="font-display font-bold mb-4">Sales Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 88%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="totalAmount" name="Revenue" fill="hsl(152, 55%, 33%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="hsl(142, 70%, 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bills Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border p-5">
        <h2 className="font-display font-bold mb-4">Bills Generated</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 88%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="billCount" stroke="hsl(36, 85%, 55%)" strokeWidth={2} dot={{ fill: "hsl(36, 85%, 55%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table */}
      <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr><th className="text-left p-3">Date</th><th className="text-right p-3">Bills</th><th className="text-right p-3">Amount</th><th className="text-right p-3">Profit</th><th className="text-left p-3 pl-4">Top Products</th></tr>
            </thead>
            <tbody>
              {dailySales.map((s) => (
                <tr key={s.date} className="border-t border-border/50">
                  <td className="p-3">{s.date}</td>
                  <td className="p-3 text-right">{s.billCount}</td>
                  <td className="p-3 text-right font-medium text-primary">₹{s.totalAmount.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium text-success">₹{s.profit.toLocaleString()}</td>
                  <td className="p-3 pl-4 text-muted-foreground">{s.topProducts.length > 0 ? s.topProducts.join(", ") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyReportPage;
