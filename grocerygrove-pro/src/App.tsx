import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ShopPage from "./pages/ShopPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WorkersPage from "./pages/admin/WorkersPage";
import InventoryPage from "./pages/admin/InventoryPage";
import SuppliersPage from "./pages/admin/SuppliersPage";
import DailyReportPage from "./pages/admin/DailyReportPage";
import MonthlyReportPage from "./pages/admin/MonthlyReportPage";
import PurchaseHistoryPage from "./pages/admin/PurchaseHistoryPage";
import NotFound from "./pages/NotFound";
import HRLayout from "./pages/hr/HRLayout";
import HRDashboard from "./pages/hr/HRDashboard";
import AttendancePage from "./pages/hr/AttendancePage";
import SalaryPage from "./pages/hr/SalaryPage";
import WorkerLayout from "./pages/worker/WorkerLayout";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerLeaves from "./pages/worker/WorkerLeaves";
import WorkerMessages from "./pages/worker/WorkerMessages";
import LeaveManagementPage from "./pages/hr/LeaveManagementPage";
import AdminInboxPage from "./pages/admin/AdminInboxPage";
import SalaryRequestsPage from "./pages/admin/SalaryRequestsPage";
import AdminHRManagementPage from "./pages/admin/AdminHRManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="purchase-history" element={<PurchaseHistoryPage />} />
            <Route path="daily-report" element={<DailyReportPage />} />
            <Route path="monthly-report" element={<MonthlyReportPage />} />
            <Route path="hr" element={<AdminHRManagementPage />} />
            <Route path="salary-requests" element={<SalaryRequestsPage />} />
            <Route path="messages" element={<AdminInboxPage />} />
          </Route>
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<HRDashboard />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="leaves" element={<LeaveManagementPage />} />
            <Route path="messages" element={<AdminInboxPage />} />
          </Route>
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<WorkerDashboard />} />
            <Route path="leaves" element={<WorkerLeaves />} />
            <Route path="messages" element={<WorkerMessages />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
