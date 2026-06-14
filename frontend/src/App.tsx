import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AppShell } from '@/layouts/app-shell'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { EmployeeListPage } from '@/features/employees/pages/employee-list-page'
import { DepartmentListPage } from '@/features/departments/pages/department-list-page'
import { ProjectDetailPage } from '@/features/projects/pages/project-detail-page'
import { ProjectListPage } from '@/features/projects/pages/project-list-page'
import { TaskBoardPage } from '@/features/tasks/pages/task-board-page'
import { AttendancePage } from '@/features/attendance/pages/attendance-page'
import { LeavePage } from '@/features/leave/pages/leave-page'
import { OvertimePage } from '@/features/overtime/pages/overtime-page'
import { ShiftPage } from '@/features/shifts/pages/shift-page'
import { OfficeLocationPage } from '@/features/office-locations/pages/office-location-page'
import { ContractsPage } from '@/features/contracts/pages/contracts-page'
import { PayrollPage } from '@/features/payroll/pages/payroll-page'
import { MyPayslipsPage } from '@/features/payroll/pages/my-payslips-page'
import { SalaryConfigPage } from '@/features/salary-configs/pages/salary-config-page'
import { ReportsPage } from '@/features/reports/pages/reports-page'
import { OkrsPage } from '@/features/okrs/pages/okrs-page'
import { PerformancePage } from '@/features/performance/pages/performance-page'
import { TrainingPage } from '@/features/training/pages/training-page'
import { NotificationsPage } from '@/features/notifications/pages/notifications-page'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="workforce-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeeListPage />} />
                  <Route path="/departments" element={<DepartmentListPage />} />
                  <Route path="/projects" element={<ProjectListPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/tasks" element={<TaskBoardPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/leave" element={<LeavePage />} />
                  <Route path="/overtime" element={<OvertimePage />} />
                  <Route path="/shifts" element={<ShiftPage />} />
                  <Route path="/office-locations" element={<OfficeLocationPage />} />
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route path="/payroll" element={<PayrollPage />} />
                  <Route path="/salary-configs" element={<SalaryConfigPage />} />
                  <Route path="/my-payslips" element={<MyPayslipsPage />} />
                  <Route path="/okrs" element={<OkrsPage />} />
                  <Route path="/performance" element={<PerformancePage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
