import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/status-badge'
import { formatDate } from '@/lib/formatters'
import { TaskCommentForm } from '@/features/tasks/components/task-comment-form'
import { TaskDiscussionList } from '@/features/tasks/components/task-discussion-list'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import { useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '@/features/tasks/api/task-queries'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { logStatusChange, logProgressChange, logTaskEdit } from '@/features/tasks/lib/activity-log'
import type { Task, TaskFormValues } from '@/features/tasks/types'
import type { TaskStatus } from '@/types/common'

const PROGRESS_PRESETS = [0, 25, 50, 75, 100]

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const updateTaskStatus = useUpdateTaskStatus()

  const [editOpen, setEditOpen] = useState(false)
  const [override, setOverride] = useState<{ progress: number; status: TaskStatus } | null>(null)

  useEffect(() => {
    if (!open) setEditOpen(false)
  }, [open])

  useEffect(() => {
    setOverride(null)
  }, [task?.id])

  if (!task) return null

  const displayProgress = override?.progress ?? task.progress
  const displayStatus = override?.status ?? task.status

  // ── Update task (from edit form) ─────────────────────────────────────────
  const handleUpdateTask = async (values: TaskFormValues): Promise<void> => {
    const updated = await updateTask.mutateAsync({ id: task.id, values })

    // Log changes asynchronously (best-effort, won't block UI)
    void logTaskEdit(task.id, {
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assigneeName: task.assigneeName,
    }, {
      title: values.title,
      startDate: values.startDate,
      dueDate: values.dueDate,
      status: values.status,
      priority: values.priority,
      progress: values.progress,
      assigneeName: updated.assigneeName,
    })
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (): Promise<void> => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}"?`)) {
      try {
        await deleteTask.mutateAsync(task.id)
        onOpenChange(false)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Xóa công việc thất bại.')
      }
    }
  }

  // ── Status change (from Select) ───────────────────────────────────────────
  const handleStatusChange = async (newStatus: TaskStatus): Promise<void> => {
    const oldStatus = displayStatus
    await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus })
    setOverride({ progress: displayProgress, status: newStatus })
    void logStatusChange(task.id, oldStatus, newStatus)
  }

  // ── Progress preset buttons ───────────────────────────────────────────────
  const handleProgressPreset = async (value: number): Promise<void> => {
    const oldProgress = displayProgress
    const oldStatus = displayStatus
    let newStatus: TaskStatus = displayStatus

    if (value === 100) {
      newStatus = 'Done'
    } else if (displayStatus === 'Done' && value < 100) {
      newStatus = 'InProgress'
    }

    await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus, progress: value })
    setOverride({ progress: value, status: newStatus })
    void logProgressChange(task.id, oldProgress, value, newStatus, oldStatus)
  }

  // ── Progress bar color ────────────────────────────────────────────────────
  const progressColor =
    displayProgress === 100
      ? 'bg-success'
      : displayProgress >= 75
        ? 'bg-primary'
        : displayProgress >= 50
          ? 'bg-warning'
          : 'bg-muted-foreground/50'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle>
                  {task.code} - {task.title}
                </DialogTitle>
                <TaskStatusBadge status={displayStatus} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  Sửa
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteTask.isPending}>
                  {deleteTask.isPending ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {task.description && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Người thực hiện</div>
                <div className="text-sm font-medium">{task.assigneeName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Người giao việc</div>
                <div className="text-sm font-medium">{task.assignerName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ngày bắt đầu</div>
                <div className="text-sm font-medium">{formatDate(task.startDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className="text-sm font-medium">{formatDate(task.dueDate)}</div>
              </div>

              {/* Trạng thái */}
              <div>
                <div className="text-xs text-muted-foreground">Trạng thái</div>
                <Select
                  value={displayStatus}
                  onValueChange={(val) => void handleStatusChange(val as TaskStatus)}
                  disabled={updateTaskStatus.isPending}
                >
                  <SelectTrigger className="h-8 w-[160px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Cần làm</SelectItem>
                    <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                    <SelectItem value="Review">Chờ nghiệm thu</SelectItem>
                    <SelectItem value="Done">Hoàn thành</SelectItem>
                    <SelectItem value="Cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* % hoàn thành */}
              <div className="sm:col-span-1">
                <div className="text-xs text-muted-foreground mb-1.5">% hoàn thành</div>

                {/* Progress bar */}
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', progressColor)}
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PROGRESS_PRESETS.map((preset) => {
                    const isActive = displayProgress === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={updateTaskStatus.isPending}
                        onClick={() => void handleProgressPreset(preset)}
                        className={cn(
                          'h-7 min-w-[2.75rem] rounded-md border px-2 text-xs font-semibold transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isActive
                            ? preset === 100
                              ? 'border-success bg-success/20 text-success'
                              : 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/60 hover:text-primary',
                          updateTaskStatus.isPending && 'opacity-50 cursor-not-allowed'
                        )}
                        aria-pressed={isActive}
                        aria-label={`Đặt tiến độ ${preset}%`}
                      >
                        {preset}%
                      </button>
                    )
                  })}
                </div>

                {displayProgress === 100 && (
                  <p className="mt-1.5 text-xs text-success font-medium">
                    ✓ Tự động chuyển trạng thái → Hoàn thành
                  </p>
                )}
              </div>

              {task.projectCode && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Dự án</div>
                  <div className="text-sm font-medium">{task.projectCode}</div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Thảo luận công việc</h3>
                <span className="text-xs text-muted-foreground">
                  — bao gồm nhật ký chỉnh sửa
                </span>
              </div>
              <TaskCommentForm taskId={task.id} />
              <TaskDiscussionList taskId={task.id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        onSubmit={handleUpdateTask}
      />
    </>
  )
}
