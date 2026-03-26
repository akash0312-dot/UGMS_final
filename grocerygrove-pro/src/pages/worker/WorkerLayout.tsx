import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { UserCircle, Calendar, MessageSquare, LogOut, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/worker", icon: UserCircle, label: "My Profile", end: true },
    { to: "/worker/leaves", icon: Calendar, label: "Leaves & Time Off" },
    { to: "/worker/messages", icon: MessageSquare, label: "Messages & Complaints" },
];

const WorkerLayout = () => {
    const navigate = useNavigate();
    const setRole = useStore((s) => s.setRole);
    const setAuthToken = useStore((s) => s.setAuthToken);
    const role = useStore((s) => s.role);

    if (role !== "worker") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen w-full bg-slate-50">
            <aside className="w-64 bg-white border-r flex flex-col shrink-0">
                <div className="p-5 flex items-center gap-3 border-b">
                    <ShoppingBasket className="h-7 w-7 text-emerald-600" />
                    <div>
                        <h1 className="font-display font-bold text-lg text-slate-900">UGMS</h1>
                        <p className="text-xs text-slate-500">Employee Portal</p>
                    </div>
                </div>
                <nav className="flex-1 px-3 space-y-1 mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 mt-auto border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setAuthToken(null); setRole("none"); navigate("/"); }}
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Secure Logout
                    </Button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default WorkerLayout;
