export interface KpiCardData {
  label: string
  value: string
  icon: 'users' | 'loader' | 'alert-triangle' | 'folder-kanban' | 'check-circle'
  helperText: string
  helperVariant: 'success' | 'muted' | 'destructive'
  /** Đường dẫn liên kết tới trang chi tiết liên quan, nếu có. */
  to?: string
}

export interface WeeklyProgressPoint {
  day: string
  completed: number
  inProgress: number
}

export interface RecentActivity {
  id: string
  actor: string
  action: string
  timestamp: string
  type: 'success' | 'create' | 'warning'
}

export interface DashboardStats {
  totalEmployees: number
  totalEmployeesHelper: string
  totalEmployeesVariant: string
  activeTasks: number
  activeTasksHelper: string
  activeTasksVariant: string
  overdueTasks: number
  overdueTasksHelper: string
  overdueTasksVariant: string
  activeProjects: number
  activeProjectsHelper: string
  activeProjectsVariant: string
  completedTasks: number
  completedTasksHelper: string
  completedTasksVariant: string
}

