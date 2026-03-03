import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchOrdersFromApi } from "@/lib/api";
import { toast } from "sonner";

interface HistoryOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface HistoryOrder {
  id: string;
  date: string;
  items: HistoryOrderItem[];
  subtotal: number;
  gst: number;
  total: number;
}

const PurchaseHistoryPage = () => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const apiOrders = await fetchOrdersFromApi();
        const mapped: HistoryOrder[] = apiOrders.map((o) => {
          const items = o.items.map((it) => ({
            name: it.product_name ?? `Product #${it.product_id}`,
            quantity: it.quantity,
            price: it.unit_price,
          }));
          const subtotal = o.total_amount;
          const gst = 0;
          const total = o.total_amount;
          return {
            id: `ORD-${o.id}`,
            date: o.created_at ?? "",
            items,
            subtotal,
            gst,
            total,
          };
        });
        setOrders(mapped);
      } catch (err: any) {
        toast.error(err.message || "Failed to load purchase history");
      }
    };
    void load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Purchase History</h1>
        <p className="text-muted-foreground text-sm">All customer invoices and transactions (from database)</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-card shadow-card border border-border p-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No purchases yet. Orders will appear here after customer checkouts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card shadow-card border border-border p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-display font-bold">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="text-sm">Total: ₹{inv.total}</Badge>
                  {typeof inv.profit === "number" && (
                    <span className="text-xs text-muted-foreground">
                      Profit: <span className="font-medium text-primary">₹{inv.profit}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((item, j) => (
                      <tr key={j} className="border-b border-border/50">
                        <td className="py-2">{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">₹{item.price}</td>
                        <td className="text-right font-medium">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-6 mt-3 text-sm">
                <span className="text-muted-foreground">Subtotal: ₹{inv.subtotal}</span>
                <span className="text-muted-foreground">GST: ₹{inv.gst}</span>
                <span className="font-bold text-primary">Total: ₹{inv.total}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;
