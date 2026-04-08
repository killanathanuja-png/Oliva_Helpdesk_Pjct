import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ToastProvider } from "@/lib/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import TicketsPage from "@/pages/TicketsPage";
import TicketDetailPage from "@/pages/TicketDetailPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import FinanceApprovalsPage from "@/pages/FinanceApprovalsPage";
import ZenotiRequestsPage from "@/pages/ZenotiRequestsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminDepartmentsPage from "@/pages/admin/AdminDepartmentsPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminCentersPage from "@/pages/admin/AdminCentersPage";
import AdminSLAPage from "@/pages/admin/AdminSLAPage";
import SLAReportPage from "@/pages/SLAReportPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminSubcategoriesPage from "@/pages/admin/AdminSubcategoriesPage";
import AdminChildCategoriesPage from "@/pages/admin/AdminChildCategoriesPage";
import AdminSubCategoryMasterPage from "@/pages/admin/AdminSubCategoryMasterPage";
import AdminServiceTitlesPage from "@/pages/admin/AdminServiceTitlesPage";
import LoginHistoryPage from "@/pages/admin/LoginHistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import TATDetailReportPage from "@/pages/TATDetailReportPage";
import NotFound from "./pages/NotFound";
import { canAccess } from "@/lib/roles";

const queryClient = new QueryClient();

const isLoggedIn = () => localStorage.getItem("oliva_logged_in") === "true";

const ProtectedRoute = ({ children, path }: { children: React.ReactNode; path?: string }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (path && !canAccess(path)) return <Navigate to="/tickets" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TicketsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TicketDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute path="/approvals">
                <AppLayout>
                  <ApprovalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance-approvals"
            element={
              <ProtectedRoute path="/finance-approvals">
                <AppLayout>
                  <FinanceApprovalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/zenoti-requests"
            element={
              <ProtectedRoute path="/zenoti-requests">
                <AppLayout>
                  <ZenotiRequestsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sla-report"
            element={
              <ProtectedRoute path="/sla-report">
                <AppLayout>
                  <SLAReportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tat-detail-report"
            element={
              <ProtectedRoute path="/tat-detail-report">
                <AppLayout>
                  <TATDetailReportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute path="/analytics">
                <AppLayout>
                  <AnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute path="/admin/users">
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute path="/admin/departments">
                <AppLayout>
                  <AdminDepartmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute path="/admin/roles">
                <AppLayout>
                  <AdminRolesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/centers"
            element={
              <ProtectedRoute path="/admin/centers">
                <AppLayout>
                  <AdminCentersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sla"
            element={
              <ProtectedRoute path="/admin/sla">
                <AppLayout>
                  <AdminSLAPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute path="/admin/categories">
                <AppLayout>
                  <AdminCategoriesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subcategories"
            element={
              <ProtectedRoute path="/admin/subcategories">
                <AppLayout>
                  <AdminSubcategoriesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/child-categories"
            element={
              <ProtectedRoute path="/admin/child-categories">
                <AppLayout>
                  <AdminChildCategoriesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admin-sub-categories"
            element={
              <ProtectedRoute path="/admin/admin-sub-categories">
                <AppLayout>
                  <AdminSubCategoryMasterPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/service-titles"
            element={
              <ProtectedRoute path="/admin/service-titles">
                <AppLayout>
                  <AdminServiceTitlesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login-history"
            element={
              <ProtectedRoute path="/admin/login-history">
                <AppLayout>
                  <LoginHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;
