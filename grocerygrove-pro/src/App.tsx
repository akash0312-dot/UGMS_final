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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
