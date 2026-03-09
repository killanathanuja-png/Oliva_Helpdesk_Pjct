import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TicketsPage from "@/pages/TicketsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminDepartmentsPage from "@/pages/admin/AdminDepartmentsPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminCentersPage from "@/pages/admin/AdminCentersPage";
import AdminSLAPage from "@/pages/admin/AdminSLAPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/tickets"
            element={
              <AppLayout>
                <TicketsPage />
              </AppLayout>
            }
          />
          <Route
            path="/approvals"
            element={
              <AppLayout>
                <ApprovalsPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AppLayout>
                <AdminUsersPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <AppLayout>
                <AdminDepartmentsPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <AppLayout>
                <AdminRolesPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/centers"
            element={
              <AppLayout>
                <AdminCentersPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/sla"
            element={
              <AppLayout>
                <AdminSLAPage />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
