import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, Check, ChevronLeft, ChevronRight, ListTodo, Plus, Clock as ClockIcon, Truck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/status-badge'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import type { RecentActivity, DashboardStats, KpiCardData } from '@/features/dashboard/types'
import {
  useDashboardStats,
  useRecentActivities,
} from '@/features/dashboard/api/dashboard-queries'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/data-state'
import { useAuth } from '@/features/auth/context/auth-context'
import { useTasks } from '@/features/tasks/api/task-queries'
import { useMyLeaveRequests } from '@/features/leave/api/leave-queries'
import { useProjects } from '@/features/projects/api/project-queries'
import type { LeaveRequest } from '@/features/leave/types'
import type { Task } from '@/features/tasks/types'
import type { Project } from '@/features/projects/types'

const ACTIVITY_ICON_MAP: Record<RecentActivity['type'], { icon: typeof Check; className: string }> = {
  success: { icon: Check, className: 'bg-success/10 text-success' },
  create: { icon: Plus, className: 'bg-primary/10 text-primary' },
  warning: { icon: ClockIcon, className: 'bg-warning/10 text-warning' },
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const LEAVE_TYPE_LABEL: Record<LeaveRequest['leaveType'], string> = {
  Annual: 'phép năm',
  Sick: 'ốm',
  Unpaid: 'không lương',
}

interface AgendaItem {
  id: string
  date: string
  title: string
  subtitle: string
  to: string
  isOverdue: boolean
  isDueSoon: boolean
  isShipping?: boolean
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isInCurrentMonth(isoDate: string, reference: Date): boolean {
  const date = new Date(isoDate)
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
}

function buildTaskAgendaItems(tasks: Task[], today: Date, referenceMonth: Date): AgendaItem[] {
  return tasks
    .filter(
      (task) =>
        task.status !== 'Done' &&
        task.status !== 'Cancelled' &&
        !!task.dueDate &&
        isInCurrentMonth(task.dueDate, referenceMonth)
    )
    .map((task) => {
      const dueDate = startOfDay(new Date(task.dueDate))
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
      return {
        id: `task-${task.id}`,
        date: task.dueDate,
        title: task.title,
        subtitle: `Công việc${task.assigneeName ? ` • ${task.assigneeName}` : ''}`,
        to: '/tasks',
        isOverdue: diffDays < 0,
        isDueSoon: diffDays >= 0 && diffDays <= 3,
      }
    })
}

function buildShippingAgendaItems(projects: Project[], referenceMonth: Date): AgendaItem[] {
  return projects
    .filter((p) => !!p.shippingDate && isInCurrentMonth(p.shippingDate, referenceMonth))
    .map((p) => ({
      id: `shipping-${p.id}`,
      date: p.shippingDate!,
      title: `Xuất hàng: ${p.name}`,
      subtitle: `Dự án ${p.code}`,
      to: `/projects`,
      isOverdue: false,
      isDueSoon: false,
      isShipping: true,
    }))
}

function buildLeaveAgendaItems(leaves: LeaveRequest[], referenceMonth: Date): AgendaItem[] {
  return leaves
    .filter(
      (leave) =>
        leave.status !== 'Rejected' &&
        (isInCurrentMonth(leave.startDate, referenceMonth) || isInCurrentMonth(leave.endDate, referenceMonth))
    )
    .map((leave) => ({
      id: `leave-${leave.id}`,
      date: leave.startDate,
      title: `Nghỉ ${LEAVE_TYPE_LABEL[leave.leaveType] ?? ''}`.trim(),
      subtitle: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`,
      to: '/leave',
      isOverdue: false,
      isDueSoon: false,
    }))
}

function mapStatsToKpis(stats: DashboardStats): KpiCardData[] {
  return [
    {
      label: 'Tổng nhân viên',
      value: stats.totalEmployees.toString(),
      icon: 'users',
      helperText: stats.totalEmployeesHelper,
      helperVariant: stats.totalEmployeesVariant as KpiCardData['helperVariant'],
      to: '/employees',
    },
    {
      label: 'Công việc đang thực hiện',
      value: stats.activeTasks.toString(),
      icon: 'loader',
      helperText: stats.activeTasksHelper,
      helperVariant: stats.activeTasksVariant as KpiCardData['helperVariant'],
      to: '/tasks',
    },
    {
      label: 'Công việc quá hạn',
      value: stats.overdueTasks.toString(),
      icon: 'alert-triangle',
      helperText: stats.overdueTasksHelper,
      helperVariant: stats.overdueTasksVariant as KpiCardData['helperVariant'],
      to: '/tasks',
    },
    {
      label: 'Dự án đang triển khai',
      value: stats.activeProjects.toString(),
      icon: 'folder-kanban',
      helperText: stats.activeProjectsHelper,
      helperVariant: stats.activeProjectsVariant as KpiCardData['helperVariant'],
      to: '/projects',
    },
    {
      label: 'Công việc hoàn thành',
      value: stats.completedTasks.toString(),
      icon: 'check-circle',
      helperText: stats.completedTasksHelper,
      helperVariant: stats.completedTasksVariant as KpiCardData['helperVariant'],
      to: '/tasks',
    },
  ]
}

export function DashboardPage() {
  const { user } = useAuth()

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats()

  const {
    data: recentActivities,
    isLoading: activitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useRecentActivities()

  const taskFilter = useMemo(
    () => (user?.employeeId != null ? { assigneeId: user.employeeId } : {}),
    [user]
  )
  const { data: myTasksData, isLoading: myTasksLoading } = useTasks(taskFilter)
  const myTasks = useMemo(() => myTasksData ?? [], [myTasksData])
  const { data: myLeaveRequestsData, isLoading: myLeaveLoading } = useMyLeaveRequests()
  const myLeaveRequests = useMemo(() => myLeaveRequestsData ?? [], [myLeaveRequestsData])

  const { data: projectsData } = useProjects()
  const allProjects = useMemo(() => projectsData ?? [], [projectsData])

  const [agendaMonth, setAgendaMonth] = useState(() => new Date())

  const today = useMemo(() => startOfDay(new Date()), [])

  const monthAgendaItems = useMemo(
    () =>
      [
        ...buildTaskAgendaItems(myTasks, today, agendaMonth),
        ...buildLeaveAgendaItems(myLeaveRequests, agendaMonth),
        ...buildShippingAgendaItems(allProjects, agendaMonth),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [myTasks, myLeaveRequests, allProjects, agendaMonth, today]
  )

  const agendaByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    monthAgendaItems.forEach((item) => {
      const key = format(new Date(item.date), 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      existing.push(item)
      map.set(key, existing)
    })
    return map
  }, [monthAgendaItems])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(agendaMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(agendaMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [agendaMonth])

  const handleRetryAll = () => {
    refetchStats()
    refetchActivities()
  }

  const hasError = statsError || activitiesError

  if (hasError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <ErrorState
          title="Không thể tải dữ liệu Tổng quan"
          description="Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng."
          onRetry={handleRetryAll}
        />
      </div>
    )
  }

  const kpis = stats ? mapStatsToKpis(stats) : []

  const todoTasks = myTasks
    .filter((task) => task.status !== 'Done' && task.status !== 'Cancelled')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)

  const agendaItems = monthAgendaItems.slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hệ thống WorkForce Manager</p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="gap-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-5 rounded-full" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3.5 w-28" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} data={kpi} />
          ))}
        </div>
      )}

      {/* To-do list & Lịch công tác */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="size-4 text-primary" />
              Việc cần làm của tôi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTasksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : todoTasks.length > 0 ? (
              <ul className="space-y-3">
                {todoTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to="/tasks"
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.projectCode ? `${task.projectCode} • ` : ''}Hạn: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-[160px] flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-muted-foreground">Không có việc cần làm</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Lịch công tác & Deadline
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => setAgendaMonth((prev) => subMonths(prev, 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[112px] text-center text-sm font-medium capitalize">
                  {format(agendaMonth, 'MMMM yyyy', { locale: vi })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => setAgendaMonth((prev) => addMonths(prev, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {myTasksLoading || myLeaveLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Mini calendar */}
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="py-1 font-medium text-muted-foreground">
                      {label}
                    </div>
                  ))}
                  {calendarDays.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayItems = agendaByDate.get(key) ?? []
                    const inMonth = isSameMonth(day, agendaMonth)
                    const hasItems = dayItems.length > 0
                    const hasUrgent = dayItems.some((item) => item.isOverdue || item.isDueSoon)
                    const hasShipping = dayItems.some((item) => item.isShipping)

                    return (
                      <div key={key} className="flex items-center justify-center py-0.5">
                        <span
                          className={cn(
                            'flex size-7 items-center justify-center rounded-full text-xs',
                            !inMonth && 'text-muted-foreground/40',
                            inMonth && !hasItems && isToday(day) && 'border border-primary font-semibold text-primary',
                            inMonth && hasItems && hasUrgent && 'bg-destructive font-semibold text-destructive-foreground',
                            inMonth && hasItems && !hasUrgent && hasShipping && 'bg-orange-500 font-semibold text-white',
                            inMonth && hasItems && !hasUrgent && !hasShipping && 'bg-primary font-semibold text-primary-foreground'
                          )}
                          title={hasItems ? dayItems.map((item) => item.title).join(', ') : undefined}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Agenda list */}
                <div className="flex flex-col">
                  {agendaItems.length > 0 ? (
                    <ul className="flex-1 space-y-1.5">
                      {agendaItems.map((item) => {
                        const date = new Date(item.date)
                        const isUrgent = item.isOverdue || item.isDueSoon

                        return (
                          <li key={item.id}>
                            <Link
                              to={item.to}
                              className="flex items-center gap-3 rounded-lg p-1.5 text-sm transition-colors hover:bg-accent"
                            >
                              <span
                                className={cn(
                                  'shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums',
                                  isUrgent
                                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                    : item.isShipping
                                      ? 'border-orange-400/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                      : 'border-primary/30 bg-primary/10 text-primary'
                                )}
                              >
                                {format(date, 'dd/MM')}
                              </span>
                              {item.isShipping && (
                                <Truck className="size-3.5 shrink-0 text-orange-500" />
                              )}
                              <span className={cn(
                                'min-w-0 flex-1 truncate',
                                item.isShipping && 'font-medium text-orange-600 dark:text-orange-400'
                              )}>
                                {item.title}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="flex flex-1 items-center justify-center py-6 text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Không có lịch công tác hoặc deadline trong tháng này
                      </p>
                    </div>
                  )}
                  <Link
                    to="/tasks"
                    className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
                  >
                    Xem chi tiết
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hoạt động gần đây */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <ul className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3.5 w-11/12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </li>
              ))}
            </ul>
          ) : recentActivities && recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {recentActivities.map((activity) => {
                const type = activity.type === 'create' || activity.type === 'success' || activity.type === 'warning' ? activity.type : 'success'
                const config = ACTIVITY_ICON_MAP[type]
                const Icon = config.icon

                return (
                  <li key={activity.id} className="flex gap-3">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        config.className
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{activity.actor}</span> {activity.action}
                      <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-muted-foreground">Không có hoạt động gần đây</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

