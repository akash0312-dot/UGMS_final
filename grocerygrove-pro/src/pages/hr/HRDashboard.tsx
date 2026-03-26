import { useStore } from "@/store/useStore";
import { Users, UserX, CheckCircle, Bell, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchWorkersFromApi, fetchAdminMessagesInApi } from "@/lib/api";
import type { Worker } from "@/data/mockData";

const HRDashboard = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchWorkersFromApi().then(setWorkers).catch(console.error);
        fetchAdminMessagesInApi().then(msgs => setRecentMessages(msgs.slice(0, 3))).catch(console.error);
    }, []);

    const totalWorkers = workers.length;
    const totalLeaves = workers.reduce((acc, w) => acc + (w.daysAbsent ?? 0), 0);

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">HR Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of staff and attendance records</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Staff</p>
                        <h3 className="text-2xl font-bold">{totalWorkers}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <UserX className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Leaves Recorded</p>
                        <h3 className="text-2xl font-bold">{totalLeaves}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-6 mb-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-500" /> Recent Alerts
                </h2>
                <p className="text-sm text-slate-500">All attendance records are up to date. Head to the Attendance or Salary tab to manage employee specifics.</p>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-500" /> Recent Messages
                </h2>
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
            </div>
        </div>
    );
};

export default HRDashboard;
