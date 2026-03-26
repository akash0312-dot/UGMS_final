import { useState, useEffect } from "react";
import { fetchWorkersFromApi, markAttendanceInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar as CalIcon } from "lucide-react";
import type { Worker } from "@/data/mockData";
import { useStore } from "@/store/useStore";

const AttendancePage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const role = useStore(s => s.role);

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = () => {
        setLoading(true);
        fetchWorkersFromApi().then((data) => {
            setWorkers(data.filter(w => {
                const isHR = w.position?.toUpperCase() === 'HR' || w.categoryName?.toUpperCase() === 'HR';
                return role === 'admin' ? isHR : !isHR;
            }));
        }).catch(() => toast.error("Failed to load workers")).finally(() => setLoading(false));
    };

    const handleMark = async (code: string, status: "Present" | "Absent" | "Leave") => {
        try {
            await markAttendanceInApi(code, status);
            toast.success(`Marked ${status} for ${code}`);
            loadWorkers(); // refresh to show updated counts
        } catch (e: any) {
            toast.error(e.message || "Failed to mark attendance.");
        }
    };

    return (
        <div className={isEmbedded ? "p-4" : "p-8 max-w-7xl mx-auto"}>
            {!isEmbedded && <h1 className="text-3xl font-display font-bold mb-6">Attendance & Leave Tracking</h1>}

            <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Staff ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4 border-r">Position</th>
                                <th className="px-6 py-4 text-center border-r" colSpan={2}>Statistics</th>
                                <th className="px-6 py-4 text-center">Action for Today</th>
                            </tr>
                            <tr className="border-b bg-slate-50 border-t-0 text-xs">
                                <th colSpan={3} className="px-6 py-2 border-r"></th>
                                <th className="px-6 py-2 text-center text-green-600 bg-green-50/50">Presences</th>
                                <th className="px-6 py-2 text-center text-red-600 bg-red-50/50 border-r">Absences/Leaves</th>
                                <th className="px-6 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {loading && <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>}
                            {!loading && workers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{worker.id}</td>
                                    <td className="px-6 py-4">{worker.name}</td>
                                    <td className="px-6 py-4 text-slate-500 border-r">{worker.position}</td>
                                    <td className="px-6 py-4 text-center font-bold text-green-600">{worker.daysPresent}</td>
                                    <td className="px-6 py-4 text-center font-bold text-red-600 border-r">{worker.daysAbsent}</td>
                                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                                        <Button variant="outline" size="sm" className="h-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleMark(worker.id, "Present")}>
                                            <Check className="w-3 h-3 mr-1" /> Present
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleMark(worker.id, "Absent")}>
                                            <X className="w-3 h-3 mr-1" /> Absent
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => handleMark(worker.id, "Leave")}>
                                            <CalIcon className="w-3 h-3 mr-1" /> Leave
                                        </Button>
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

export default AttendancePage;
