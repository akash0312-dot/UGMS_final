import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, Users, DollarSign, LogOut, ShoppingBasket, ClipboardList, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/hr", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/hr/attendance", icon: Users, label: "Attendance & Leaf" },
    { to: "/hr/salary", icon: DollarSign, label: "Salary & Bonus" },
    { to: "/hr/leaves", icon: ClipboardList, label: "Leave Requests" },
    { to: "/hr/messages", icon: Mail, label: "Inbox" },
];

const HRLayout = () => {
    const navigate = useNavigate();
    const setRole = useStore((s) => s.setRole);
    const setAuthToken = useStore((s) => s.setAuthToken);
    const role = useStore((s) => s.role);

    if (role !== "hr" && role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen w-full bg-background rounded-l-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)]">
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-white">
                <div className="p-5 flex items-center gap-3">
                    <ShoppingBasket className="h-7 w-7 text-indigo-400" />
                    <div>
                        <h1 className="font-display font-bold text-lg">UGMS HR</h1>
                        <p className="text-xs text-slate-400">Staff Portal</p>
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
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={() => { setAuthToken(null); setRole("none"); navigate("/"); }}
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto bg-slate-50/50">
                <Outlet />
            </main>
        </div>
    );
};

export default HRLayout;
