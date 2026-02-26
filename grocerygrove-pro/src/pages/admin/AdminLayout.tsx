import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, Users, Package, Truck, BarChart3, TrendingUp, LogOut, Store, AlertTriangle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/workers", icon: Users, label: "Workers" },
  { to: "/admin/inventory", icon: Package, label: "Inventory" },
  { to: "/admin/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/admin/purchase-history", icon: History, label: "Purchase History" },
  { to: "/admin/daily-report", icon: BarChart3, label: "Daily Sales" },
  { to: "/admin/monthly-report", icon: TrendingUp, label: "Monthly Report" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);
  const products = useStore((s) => s.products);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="w-64 gradient-hero border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3">
          <Store className="h-7 w-7" style={{ color: "hsl(152, 55%, 45%)" }} />
          <div>
            <h1 className="font-display font-bold text-lg" style={{ color: "hsl(0, 0%, 100%)" }}>UGMS</h1>
            <p className="text-xs" style={{ color: "hsl(140, 15%, 60%)" }}>Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === "Inventory" && lowStockCount > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  {lowStockCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => { setRole("none"); navigate("/"); }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
