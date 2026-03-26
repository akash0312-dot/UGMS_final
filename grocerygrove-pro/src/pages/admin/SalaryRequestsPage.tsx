import { useState, useEffect } from "react";
import { fetchSalaryRequestsInApi, resolveSalaryRequestInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const SalaryRequestsPage = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = () => {
        setLoading(true);
        fetchSalaryRequestsInApi()
            .then(setRequests)
            .catch(() => toast.error("Failed to load salary requests"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleResolve = async (id: number, status: "Approved" | "Rejected") => {
        try {
            await resolveSalaryRequestInApi(id, status);
            toast.success(`Request ${status} successfully!`);
            loadRequests();
        } catch (e: any) {
            toast.error(e.message || `Failed to ${status} request.`);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-display font-bold mb-6">Salary Change Requests</h1>
            
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Request Date</th>
                                <th className="px-6 py-4">Staff Details</th>
                                <th className="px-6 py-4">Current Base</th>
                                <th className="px-6 py-4">Proposed Base</th>
                                <th className="px-6 py-4">Proposed Bonus</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {loading && <tr><td colSpan={6} className="text-center p-4 text-slate-500">Loading requests...</td></tr>}
                            {!loading && requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-slate-500">
                                        <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                        <p>No pending salary requests.</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && requests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{req.worker_name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{req.worker_code}</p>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        ${req.current_salary?.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-indigo-600">
                                        {req.proposed_salary ? `$${req.proposed_salary.toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">
                                        {req.proposed_bonus ? `$${req.proposed_bonus.toFixed(2)}` : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {req.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2">
                                        {req.status === "Pending" ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleResolve(req.id, "Approved")}
                                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleResolve(req.id, "Rejected")}
                                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-medium py-1.5">No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalaryRequestsPage;
