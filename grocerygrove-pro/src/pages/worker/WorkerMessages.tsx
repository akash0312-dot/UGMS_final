import { useState, useEffect } from "react";
import { fetchMyMessagesInApi, sendWorkerMessageInApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, Send, AlertCircle } from "lucide-react";

const WorkerMessages = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isComposing, setIsComposing] = useState(false);
    const [receiver, setReceiver] = useState<"hr" | "admin">("admin");
    const [content, setContent] = useState("");

    const loadMessages = () => {
        setLoading(true);
        fetchMyMessagesInApi().then(setMessages).catch(() => toast.error("Failed to load messages")).finally(() => setLoading(false));
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleSend = async () => {
        if (!content) {
            toast.error("Message cannot be empty.");
            return;
        }
        try {
            await sendWorkerMessageInApi(receiver, content);
            toast.success("Message sent successfully!");
            setIsComposing(false);
            setContent("");
            loadMessages();
        } catch (e: any) {
            toast.error(e.message || "Failed to send message.");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold">Inbox & Complaints</h1>
                <Button onClick={() => setIsComposing(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
            </div>

            <div className="space-y-4">
                {loading && <p className="text-slate-500">Loading inbox...</p>}
                {!loading && messages.length === 0 && (
                    <div className="text-center p-12 bg-white border rounded-xl text-slate-500 flex flex-col items-center">
                        <Mail className="w-12 h-12 mb-4 text-slate-300" />
                        <p>You have no messages yet.</p>
                    </div>
                )}
                {!loading && messages.map((msg) => (
                    <div key={msg.id} className="bg-white border rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${msg.sender_role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {msg.sender_role === 'admin' ? <AlertCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                </div>
                                <h3 className="font-bold text-slate-900">{msg.sender_name} <span className="text-xs text-slate-500 font-normal ml-1">({msg.sender_role.toUpperCase()})</span></h3>
                            </div>
                            <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed text-sm">
                            {msg.content}
                        </p>
                    </div>
                ))}
            </div>

            <Dialog open={isComposing} onOpenChange={setIsComposing}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Send Message / Complaint</DialogTitle>
                        <DialogDescription>
                            Reach out directly to HR or the System Owner (Admin).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">To:</p>
                            <Select value={receiver} onValueChange={(val: "hr" | "admin") => setReceiver(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select recipient" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Owner (Admin)</SelectItem>
                                    <SelectItem value="hr">Human Resources (HR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Message Details:</p>
                            <Textarea
                                placeholder="Describe your issue or feedback..."
                                className="h-32 resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsComposing(false)}>Cancel</Button>
                        <Button onClick={handleSend}>Dispatch Message</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkerMessages;
