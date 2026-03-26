import { useState, useEffect } from "react";
import { fetchMyProfileInApi, fetchMyMessagesInApi } from "@/lib/api";
import { User, Phone, Briefcase, Award, CalendarCheck, CalendarX, DollarSign, Mail } from "lucide-react";

const WorkerDashboard = () => {
    const [profile, setProfile] = useState<any>(null);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchMyProfileInApi().then(setProfile).catch(console.error);
        fetchMyMessagesInApi().then(msgs => setRecentMessages(msgs.slice(0, 3))).catch(console.error);
    }, []);

    if (!profile) {
        return <div className="p-8 text-center text-slate-500">Loading Profile...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

            <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8 flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <User className="h-12 w-12" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                    <p className="text-slate-500 mb-4">{profile.id}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">Role:</span>
                            <span className="font-medium">{profile.category_name || profile.role || "Staff"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">Phone:</span>
                            <span className="font-medium">{profile.phone || "Not provided"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">Experience:</span>
                            <span className="font-medium">{profile.experience_years} years</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">Base Salary:</span>
                            <span className="font-medium">${profile.salary}</span>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Attendance Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CalendarCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Days Present</p>
                        <h3 className="text-3xl font-bold text-slate-900">{profile.days_present}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border shadow-sm flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <CalendarX className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Days Absent</p>
                        <h3 className="text-3xl font-bold text-slate-900">{profile.days_absent}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-6 mt-8">
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
                                    <span className="font-semibold text-sm">{m.sender_name || (m.sender_role === 'admin' ? "Owner" : "HR")}</span>
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

export default WorkerDashboard;
