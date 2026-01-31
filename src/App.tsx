import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

// Placeholder pages - will be implemented in next phases
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Leaves from "./pages/Leaves";
import ExtraWork from "./pages/ExtraWork";
import Shoots from "./pages/Shoots";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import SalaryHistory from "./pages/SalaryHistory";
import Performance from "./pages/Performance";
import TeamCalendar from "./pages/TeamCalendar";
import EmployeeWorkCalendar from "./pages/EmployeeWorkCalendar";

// Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminSalary from "./pages/admin/AdminSalary";
import AdminShoots from "./pages/admin/AdminShoots";
import AdminReports from "./pages/admin/AdminReports";
import AdminRules from "./pages/admin/AdminRules";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes with dashboard layout */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Employee routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/extra-work" element={<ExtraWork />} />
              <Route path="/shoots" element={<Shoots />} />
              <Route path="/salary-history" element={<SalaryHistory />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/team-calendar" element={<TeamCalendar />} />
              <Route path="/employee-work-calendar" element={<EmployeeWorkCalendar />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminApprovals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/salary"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSalary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shoots"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminShoots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rules"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminRules />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
