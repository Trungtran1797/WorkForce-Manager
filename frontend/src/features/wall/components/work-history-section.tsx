import { useMemo } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  BarChart3,
  CalendarDays,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/features/auth/context/auth-context'
import { useTasks } from '@/features/tasks/api/task-queries'
import type { Task } from '@/features/tasks/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Done: { label: 'Hoàn thành', color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2 },
  InProgress: { label: 'Đang thực hiện', color: 'text-primary bg-primary/10 border-primary/20', icon: Clock },
  Todo: { label: 'Chờ thực hiện', color: 'text-muted-foreground bg-muted/30 border-border', icon: ListTodo },
  Review: { label: 'Đang review', color: 'text-warning bg-warning/10 border-warning/20', icon: AlertTriangle },
  Cancelled: { label: 'Đã hủy', color: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertTriangle },
}

const PRIORITY_COLOR: Record<string, string> = {
  High: 'text-destructive',
  Medium: 'text-warning',
  Low: 'text-muted-foreground',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(task: Task): boolean {
  return task.status !== 'Done' && task.status !== 'Cancelled' && task.dueDate && new Date(task.dueDate) < new Date() ? true : false
}

export function WorkHistorySection() {
  const { user } = useAuth()
  const employeeId = user?.employeeId
  const { data: allTasks = [], isLoading } = useTasks({ assigneeId: employeeId ?? undefined })

  const stats = useMemo(() => {
    const done = allTasks.filter((t) => t.status === 'Done').length
    const inProgress = allTasks.filter((t) => t.status === 'InProgress').length
    const overdue = allTasks.filter(isOverdue).length
    const total = allTasks.length
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
    const projects = new Set(allTasks.filter((t) => t.projectId).map((t) => t.projectCode)).size
    return { done, inProgress, overdue, total, completionRate, projects }
  }, [allTasks])

  const byStatus = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    allTasks.forEach((t) => {
      const key = t.status
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return groups
  }, [allTasks])

  const recentTasks = useMemo(
    () =>
      [...allTasks]
        .sort((a, b) => {
          const dateA = a.dueDate || a.startDate || ''
          const dateB = b.dueDate || b.startDate || ''
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })
        .slice(0, 15),
    [allTasks],
  )

  if (isLoading) {
    return (
      <Card className="p-6 border-border bg-card/50">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <Card className="border-border bg-card/50 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          Tổng quan công việc
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: ListTodo, label: 'Tổng công việc', value: stats.total, color: 'text-foreground' },
            { icon: CheckCircle2, label: 'Hoàn thành', value: stats.done, color: 'text-success' },
            { icon: Clock, label: 'Đang thực hiện', value: stats.inProgress, color: 'text-primary' },
            { icon: AlertTriangle, label: 'Quá hạn', value: stats.overdue, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/40">
              <s.icon className={`size-5 ${s.color} shrink-0`} />
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tỷ lệ hoàn thành</span>
            <span className="font-semibold text-foreground">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <FolderOpen className="size-3.5 text-warning" />
          Tham gia <span className="font-semibold text-foreground mx-1">{stats.projects}</span> dự án
        </div>
      </Card>

      {/* Status breakdown */}
      {Object.entries(byStatus).length > 0 && (
        <Card className="border-border bg-card/50 p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            Phân loại theo trạng thái
          </h3>
          <div className="space-y-2">
            {Object.entries(byStatus)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([status, tasks]) => {
                const config = STATUS_CONFIG[status] ?? { label: status, color: 'text-muted-foreground bg-muted/30 border-border', icon: ListTodo }
                const Icon = config.icon
                const pct = stats.total > 0 ? Math.round((tasks.length / stats.total) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium w-36 ${config.color}`}>
                      <Icon className="size-3.5" />
                      {config.label}
                    </div>
                    <div className="flex-1">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-12 text-right">
                      {tasks.length} ({pct}%)
                    </span>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Recent tasks timeline */}
      <Card className="border-border bg-card/50 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-warning" />
          Công việc gần đây ({recentTasks.length})
        </h3>

        {recentTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ListTodo className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có công việc nào được giao.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => {
              const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG['Todo']
              const Icon = config.icon
              const overdue = isOverdue(task)
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent/30 ${overdue ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-card/30'}`}
                >
                  <Icon className={`size-4 mt-0.5 shrink-0 ${overdue ? 'text-destructive' : config.icon === CheckCircle2 ? 'text-success' : 'text-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{task.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 px-1.5 border ${config.color}`}
                      >
                        {config.label}
                      </Badge>
                      {overdue && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Quá hạn</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {task.projectCode && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <FolderOpen className="size-3" />
                          {task.projectCode}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium ${PRIORITY_COLOR[task.priority] ?? 'text-muted-foreground'}`}>
                        {task.priority === 'High' ? 'Cao' : task.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {task.status === 'InProgress' && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={task.progress} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{task.progress}%</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
