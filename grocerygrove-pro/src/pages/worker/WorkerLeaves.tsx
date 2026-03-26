import { useState, useEffect } from "react";
import { fetchMyLeavesInApi, submitLeaveRequestInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus } from "lucide-react";

const WorkerLeaves = () => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRequesting, setIsRequesting] = useState(false);
    const [reqDate, setReqDate] = useState("");
    const [reqReason, setReqReason] = useState("");

    const loadLeaves = () => {
        setLoading(true);
        fetchMyLeavesInApi().then(setLeaves).catch(() => toast.error("Failed to load leaves")).finally(() => setLoading(false));
    };

    useEffect(() => {
        loadLeaves();
    }, []);

    const handleSubmit = async () => {
        if (!reqDate || !reqReason) {
            toast.error("Please fill all fields.");
            return;
        }
        try {
            await submitLeaveRequestInApi(reqDate, reqReason);
            toast.success("Leave request submitted successfully");
            setIsRequesting(false);
            setReqDate("");
            setReqReason("");
            loadLeaves();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit request.");
        }
    };

    const getStatusColor = (status: string) => {
        if (status === "Approved") return "text-emerald-700 bg-emerald-50 border-emerald-200";
        if (status === "Rejected") return "text-red-700 bg-red-50 border-red-200";
        return "text-amber-700 bg-amber-50 border-amber-200";
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold">My Leaves</h1>
                <Button onClick={() => setIsRequesting(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> Request Leave
                </Button>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-4">Date Requested</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Submitted On</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {loading && <tr><td colSpan={4} className="text-center p-6 text-slate-500">Loading your requests...</td></tr>}
                        {!loading && leaves.length === 0 && (
                            <tr><td colSpan={4} className="text-center p-6 text-slate-500">You haven't submitted any leave requests yet.</td></tr>
                        )}
                        {!loading && leaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(leave.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(leave.status)}`}>
                                        {leave.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {new Date(leave.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isRequesting} onOpenChange={setIsRequesting}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                        <DialogDescription>
                            State the date and reason for your absence. HR will review your request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date of Absence</Label>
                            <Input
                                id="date"
                                type="date"
                                value={reqDate}
                                onChange={(e) => setReqDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Detailed Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Providing context helps HR approve it faster..."
                                className="h-24"
                                value={reqReason}
                                onChange={(e) => setReqReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequesting(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkerLeaves;
