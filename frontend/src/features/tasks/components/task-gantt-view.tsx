import { useMemo } from 'react'
import { differenceInCalendarDays, eachDayOfInterval, format, isWeekend } from 'date-fns'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Task } from '@/features/tasks/types'
import type { TaskStatus } from '@/types/common'

const STATUS_BAR_COLOR: Record<TaskStatus, string> = {
  Todo: 'bg-muted-foreground/40',
  InProgress: 'bg-primary',
  Review: 'bg-warning',
  Done: 'bg-success',
  Cancelled: 'bg-destructive/60',
}

const DAY_WIDTH_PX = 32

export function TaskGanttView({ tasks }: { tasks: Task[] }) {
  const { days, rangeStart } = useMemo(() => {
    const starts = tasks.map((task) => new Date(task.startDate).getTime())
    const ends = tasks.map((task) => new Date(task.dueDate).getTime())
    const minStart = new Date(Math.min(...starts))
    const maxEnd = new Date(Math.max(...ends))

    return {
      rangeStart: minStart,
      days: eachDayOfInterval({ start: minStart, end: maxEnd }),
    }
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Không có công việc để hiển thị Gantt Chart.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-x-auto p-0">
      <div style={{ minWidth: `${240 + days.length * DAY_WIDTH_PX}px` }}>
        {/* Header row - dates */}
        <div className="flex border-b border-border bg-muted/50 text-xs">
          <div className="w-60 shrink-0 border-r border-border px-3 py-2 font-medium">Công việc</div>
          <div className="flex">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex shrink-0 flex-col items-center justify-center border-r border-border py-2 text-muted-foreground',
                  isWeekend(day) && 'bg-muted/60'
                )}
                style={{ width: `${DAY_WIDTH_PX}px` }}
              >
                <span>{format(day, 'd')}</span>
                <span className="text-[10px]">{format(day, 'MMM')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasks.map((task) => {
          const offsetDays = differenceInCalendarDays(new Date(task.startDate), rangeStart)
          const durationDays = Math.max(
            1,
            differenceInCalendarDays(new Date(task.dueDate), new Date(task.startDate)) + 1
          )

          return (
            <div key={task.id} className="flex border-b border-border text-sm last:border-0">
              <div className="w-60 shrink-0 border-r border-border px-3 py-2.5">
                <div className="truncate font-medium">{task.title}</div>
                <div className="truncate text-xs text-muted-foreground">{task.assigneeName}</div>
              </div>
              <div className="relative flex-1 py-2.5" style={{ width: `${days.length * DAY_WIDTH_PX}px` }}>
                <div
                  className={cn(
                    'absolute top-1/2 h-5 -translate-y-1/2 rounded-md',
                    STATUS_BAR_COLOR[task.status]
                  )}
                  style={{
                    left: `${offsetDays * DAY_WIDTH_PX}px`,
                    width: `${durationDays * DAY_WIDTH_PX - 4}px`,
                  }}
                  title={`${task.title}: ${format(new Date(task.startDate), 'dd/MM')} - ${format(new Date(task.dueDate), 'dd/MM')}`}
                >
                  {task.status === 'InProgress' && (
                    <div
                      className="h-full rounded-md bg-primary/60"
                      style={{ width: `${task.progress}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
