import { useMemo, useState } from 'react'
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
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TaskPriorityBadge } from '@/components/common/status-badge'
import { cn } from '@/lib/utils'
import type { Task } from '@/features/tasks/types'

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function TaskCalendarView({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()

    tasks.forEach((task) => {
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      existing.push(task)
      map.set(key, existing)
    })

    return map
  }, [tasks])

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: vi })}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-muted/50 px-2 py-2 text-center font-medium text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(key) ?? []

          return (
            <div
              key={key}
              className={cn(
                'min-h-24 bg-card p-1.5',
                !isSameMonth(day, currentMonth) && 'bg-muted/30 text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'mb-1 flex size-6 items-center justify-center rounded-full text-xs',
                  isToday(day) && 'bg-primary text-primary-foreground font-semibold'
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[11px] text-muted-foreground">+{dayTasks.length - 2} khác</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Độ ưu tiên các công việc trong tháng:</span>
        {(['Low', 'Medium', 'High', 'Urgent'] as const).map((priority) => (
          <TaskPriorityBadge key={priority} priority={priority} />
        ))}
      </div>
    </Card>
  )
}
