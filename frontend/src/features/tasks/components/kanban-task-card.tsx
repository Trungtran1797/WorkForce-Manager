import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TaskPriorityBadge } from '@/components/common/status-badge'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import type { Task } from '@/features/tasks/types'

export function KanbanTaskCard({ task, canEdit = true }: { task: Task; canEdit?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canEdit ? listeners : {})}
      className={cn(
        'gap-2 p-3 text-sm shadow-sm',
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'opacity-50',
        task.status === 'Done' && 'opacity-70'
      )}
    >
      {task.parentTaskTitle && (
        <div className="truncate text-xs text-muted-foreground">↳ {task.parentTaskTitle}</div>
      )}
      <div className={cn('font-medium', task.status === 'Done' && 'line-through')}>
        {task.title}
      </div>
      <div className="text-xs text-muted-foreground">
        {task.assigneeName} • Hạn: {formatDate(task.dueDate)}
      </div>
      {task.subTaskCount > 0 && (
        <Badge variant="gray">{task.subTaskCount} công việc con</Badge>
      )}
      {task.status === 'InProgress' && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">{task.progress}%</div>
        </div>
      )}
      <TaskPriorityBadge priority={task.priority} />
    </Card>
  )
}
