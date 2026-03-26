import { useState, useEffect } from "react";
import { fetchAllLeavesInApi, resolveLeaveInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { useStore } from "@/store/useStore";

const LeaveManagementPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const role = useStore(s => s.role);

    const loadLeaves = () => {
        setLoading(true);
        fetchAllLeavesInApi().then((data) => {
            const filtered = data.filter((l: any) => {
                const isHRCat = l.worker_category?.toUpperCase() === 'HR';
                return role === 'admin' ? isHRCat : !isHRCat;
            });
            setLeaves(filtered);
        }).catch(() => toast.error("Failed to load leaves")).finally(() => setLoading(false));
    };

    useEffect(() => {
        loadLeaves();
    }, []);

    const handleResolve = async (id: number, status: "Approved" | "Rejected") => {
        try {
            await resolveLeaveInApi(id, status);
            toast.success(`Leave request ${status.toLowerCase()}`);
            loadLeaves();
        } catch (e: any) {
            toast.error(e.message || "Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        if (status === "Approved") return "text-emerald-700 bg-emerald-50 border-emerald-200";
        if (status === "Rejected") return "text-red-700 bg-red-50 border-red-200";
        return "text-amber-700 bg-amber-50 border-amber-200";
    };

    return (
        <div className={isEmbedded ? "p-4" : "p-8 max-w-6xl mx-auto"}>
            {!isEmbedded && <h1 className="text-3xl font-display font-bold mb-6">Staff Leave Requests</h1>}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-4">Worker</th>
                            <th className="px-6 py-4">Requested Date</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {loading && <tr><td colSpan={5} className="text-center p-6 text-slate-500">Loading requests...</td></tr>}
                        {!loading && leaves.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-6 text-slate-500">No leave requests found.</td></tr>
                        )}
                        {!loading && leaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{leave.worker_name}</p>
                                    <p className="text-xs text-slate-500">{leave.worker_code}</p>
                                </td>
                                <td className="px-6 py-4 font-medium flex items-center gap-2 mt-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(leave.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-slate-600 max-w-sm truncate whitespace-pre-wrap" title={leave.reason}>
                                    {leave.reason}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(leave.status)}`}>
                                        {leave.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    {leave.status === "Pending" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResolve(leave.id, "Approved")}
                                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResolve(leave.id, "Rejected")}
                                                className="text-red-700 border-red-200 hover:bg-red-50"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagementPage;
