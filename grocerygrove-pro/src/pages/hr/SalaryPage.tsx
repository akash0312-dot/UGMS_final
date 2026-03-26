import { useState, useEffect } from "react";
import { fetchWorkersFromApi, requestSalaryChangeInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, ExternalLink, Activity } from "lucide-react";
import type { Worker } from "@/data/mockData";

const SalaryPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [newSalary, setNewSalary] = useState("");

    const [isAddingBonus, setIsAddingBonus] = useState(false);
    const [bonusAmount, setBonusAmount] = useState("");
    
    const role = useStore(s => s.role);

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = () => {
        setLoading(true);
        fetchWorkersFromApi().then(data => {
            setWorkers(data.filter(w => {
                const isHR = w.position?.toUpperCase() === 'HR' || w.categoryName?.toUpperCase() === 'HR';
                return role === 'admin' ? isHR : !isHR;
            }));
        }).catch(() => toast.error("Failed to load workers")).finally(() => setLoading(false));
    };

    const handleUpdateSalary = async () => {
        if (!selectedWorker) return;
        try {
            await requestSalaryChangeInApi(selectedWorker.id, Number(newSalary), undefined);
            toast.success(`Request sent to update base salary for ${selectedWorker.name}`);
            setIsEditingSalary(false);
            loadWorkers();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit salary request.");
        }
    };

    const handeAddBonus = async () => {
        if (!selectedWorker) return;
        try {
            await requestSalaryChangeInApi(selectedWorker.id, undefined, Number(bonusAmount));
            toast.success(`Request sent to award bonus of $${bonusAmount} for ${selectedWorker.name}`);
            setIsAddingBonus(false);
            setBonusAmount("");
            loadWorkers();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit bonus request.");
        }
    };

    return (
        <div className={isEmbedded ? "p-4" : "p-8 max-w-7xl mx-auto"}>
            {!isEmbedded && <h1 className="text-3xl font-display font-bold mb-6">Staff Salary & Bonus Management</h1>}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Staff ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Current Base Salary</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {loading && <tr><td colSpan={5} className="text-center p-4">Loading data...</td></tr>}
                            {!loading && workers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">{worker.id}</td>
                                    <td className="px-6 py-4 font-medium">{worker.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{worker.position}</td>
                                    <td className="px-6 py-4 font-bold text-green-600">${worker.salary?.toFixed(2) || "0.00"}</td>
                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedWorker(worker);
                                                setNewSalary(String(worker.salary));
                                                setIsEditingSalary(true);
                                            }}
                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <Activity className="w-4 h-4 mr-1" /> Edit Base Pay
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedWorker(worker);
                                                setIsAddingBonus(true);
                                                setBonusAmount("");
                                            }}
                                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        >
                                            <DollarSign className="w-4 h-4 mr-1" /> Add Bonus
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Salary Modal */}
            <Dialog open={isEditingSalary} onOpenChange={setIsEditingSalary}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Base Salary</DialogTitle>
                        <DialogDescription>
                            Adjusting the recurring monthly salary for {selectedWorker?.name} ({selectedWorker?.id}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="salary" className="col-span-1 border-r pr-4 text-right">
                                Salary
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <span className="text-muted-foreground">$</span>
                                <Input
                                    id="salary"
                                    type="number"
                                    value={newSalary}
                                    onChange={(e) => setNewSalary(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingSalary(false)}>Cancel</Button>
                        <Button onClick={handleUpdateSalary}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Bonus Modal */}
            <Dialog open={isAddingBonus} onOpenChange={setIsAddingBonus}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Grant Ad-hoc Bonus</DialogTitle>
                        <DialogDescription>
                            Award {selectedWorker?.name} an immediate bonus directly correlated to their performance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bonus" className="col-span-1 border-r pr-4 text-right">
                                Amount
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <span className="text-muted-foreground">$</span>
                                <Input
                                    id="bonus"
                                    type="number"
                                    value={bonusAmount}
                                    onChange={(e) => setBonusAmount(e.target.value)}
                                    className="w-full"
                                    placeholder="e.g. 500"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingBonus(false)}>Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handeAddBonus}>Record Bonus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SalaryPage;
