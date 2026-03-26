import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendancePage from "../hr/AttendancePage";
import SalaryPage from "../hr/SalaryPage";
import LeaveManagementPage from "../hr/LeaveManagementPage";

const AdminHRManagementPage = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-display font-bold mb-2">HR Management</h1>
            <p className="text-slate-500 mb-8 max-w-2xl">
                Oversee the human resources department. This section strictly handles attendance, salaries, and leave requests for HR staff members. Regular worker details are managed by the HR team.
            </p>
            
            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="mb-6 w-full max-w-md grid grid-cols-3">
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="salary">Salaries</TabsTrigger>
                    <TabsTrigger value="leaves">Leaves</TabsTrigger>
                </TabsList>
                
                <TabsContent value="attendance" className="mt-0">
                    <div className="bg-slate-50/50 rounded-2xl border -mx-4 sm:mx-0 overflow-hidden">
                        <AttendancePage isEmbedded={true} />
                    </div>
                </TabsContent>
                
                <TabsContent value="salary" className="mt-0">
                    <div className="bg-slate-50/50 rounded-2xl border -mx-4 sm:mx-0 overflow-hidden">
                        <SalaryPage isEmbedded={true} />
                    </div>
                </TabsContent>
                
                <TabsContent value="leaves" className="mt-0">
                    <div className="bg-slate-50/50 rounded-2xl border -mx-4 sm:mx-0 overflow-hidden">
                        <LeaveManagementPage isEmbedded={true} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminHRManagementPage;
