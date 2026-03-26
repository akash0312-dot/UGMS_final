import { useState, useEffect } from "react";
import { fetchAdminMessagesInApi, markMessageReadInApi, broadcastAdminMessageInApi, fetchWorkersFromApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, CheckCircle, Send, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminInboxPage = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposing, setIsComposing] = useState(false);
    const [broadcastContent, setBroadcastContent] = useState("");
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>("all");
    const role = useStore(s => s.role);

    const loadMessages = () => {
        setLoading(true);
        Promise.all([fetchAdminMessagesInApi(), fetchWorkersFromApi()])
            .then(([msgs, wrks]) => {
                setMessages(msgs);
                setWorkers(wrks);
            })
            .catch(() => toast.error("Failed to load inbox data"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleRead = async (id: number) => {
        try {
            await markMessageReadInApi(id);
            toast.success("Message marked as read");
            loadMessages();
        } catch (e: any) {
            toast.error(e.message || "Failed to update message");
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastContent.trim()) {
            toast.error("Message cannot be empty.");
            return;
        }
        try {
            const isOwnerDest = selectedWorkerId === "admin";
            const wId = (selectedWorkerId === "all" || isOwnerDest) ? undefined : selectedWorkerId;
            const rRole = isOwnerDest ? "admin" : "worker";
            await broadcastAdminMessageInApi(broadcastContent.trim(), wId, rRole);
            toast.success(isOwnerDest ? "Message sent to Owner successfully!" : (wId ? "Message sent to worker successfully!" : "Message broadcasted to all workers successfully!"));
            setIsComposing(false);
            setBroadcastContent("");
            setSelectedWorkerId("all");
        } catch (e: any) {
            toast.error(e.message || "Failed to send message.");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold">Management Inbox</h1>
                <Button onClick={() => setIsComposing(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
            </div>

            <div className="space-y-4">
                {loading && <p className="text-slate-500">Loading messages...</p>}
                {!loading && messages.length === 0 && (
                    <div className="text-center p-12 bg-white border rounded-xl text-slate-500 flex flex-col items-center">
                        <Mail className="w-12 h-12 mb-4 text-slate-300" />
                        <p>Inbox is entirely clear.</p>
                    </div>
                )}
                {!loading && messages.map((msg) => (
                    <div key={msg.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-opacity ${msg.is_read ? 'opacity-60' : 'opacity-100 border-l-4 border-l-amber-500'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{msg.sender_name} <span className="text-xs text-slate-500 ml-1">({msg.sender_code})</span></h3>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">{msg.sender_role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
                                {!msg.is_read && (
                                    <Button variant="outline" size="sm" onClick={() => handleRead(msg.id)}>
                                        <CheckCircle className="w-4 h-4 mr-1" /> Mark Read
                                    </Button>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap text-sm leading-relaxed mt-4">
                            {msg.content}
                        </p>
                    </div>
                ))}
            </div>

            {/* Broadcast Dialog */}
            <Dialog open={isComposing} onOpenChange={setIsComposing}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Message to Worker(s)</DialogTitle>
                        <DialogDescription>
                            Distribute a message globally or to a specific employee.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Recipient" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Workers (Broadcast)</SelectItem>
                                {role === 'hr' && <SelectItem value="admin">Owner</SelectItem>}
                                <SelectGroup>
                                    {workers.map(w => (
                                        <SelectItem key={w.db_id || w.id} value={(w.db_id || w.id).toString()}>
                                            {w.name} ({w.worker_code || w.id})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Write your message here..."
                            className="h-32 resize-none"
                            value={broadcastContent}
                            onChange={(e) => setBroadcastContent(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsComposing(false)}>Cancel</Button>
                        <Button onClick={handleBroadcast}>Send Message</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminInboxPage;
