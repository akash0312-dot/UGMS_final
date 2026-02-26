import { monthlyReport } from "@/data/mockData";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const MonthlyReportPage = () => {
  const { totalSales, totalPurchaseCost, workerSalaries, otherExpenses, netProfit } = monthlyReport;
  const totalExpenses = totalPurchaseCost + workerSalaries + otherExpenses;

  const expenseData = [
    { name: "Purchase Cost", value: totalPurchaseCost, color: "hsl(210, 70%, 50%)" },
    { name: "Worker Salaries", value: workerSalaries, color: "hsl(36, 85%, 55%)" },
    { name: "Other Expenses", value: otherExpenses, color: "hsl(0, 72%, 51%)" },
  ];

  const barData = [
    { name: "Total Sales", amount: totalSales },
    { name: "Total Expenses", amount: totalExpenses },
    { name: "Net Profit", amount: netProfit },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Monthly Financial Report</h1>
        <p className="text-muted-foreground text-sm">February 2026 — Profit & Loss Analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Sales", value: totalSales, cls: "text-primary" },
          { label: "Purchase Cost", value: totalPurchaseCost, cls: "" },
          { label: "Worker Salaries", value: workerSalaries, cls: "" },
          { label: "Other Expenses", value: otherExpenses, cls: "" },
          { label: "Net Profit", value: netProfit, cls: netProfit >= 0 ? "text-success" : "text-destructive" },
        ].map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card border border-border p-4 text-center">
            <p className={`text-xl font-display font-bold ${item.cls}`}>₹{item.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border p-5">
          <h2 className="font-display font-bold mb-4">Expense Breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border p-5">
          <h2 className="font-display font-bold mb-4">Revenue vs Expenses</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  <Cell fill="hsl(152, 55%, 33%)" />
                  <Cell fill="hsl(0, 72%, 51%)" />
                  <Cell fill="hsl(36, 85%, 55%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonthlyReportPage;
