import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { KanbanTaskCard } from '@/features/tasks/components/kanban-task-card'
import type { Task } from '@/features/tasks/types'
import type { TaskStatus } from '@/types/common'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  canEditTask?: (task: Task) => boolean
}

export function KanbanColumn({ status, title, tasks, canEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[260px] flex-1 flex-col rounded-xl bg-muted/50 p-3 transition-colors',
        isOver && 'bg-muted'
      )}
    >
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        {title}
        <Badge variant="gray">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 min-h-12">
          {tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} canEdit={canEditTask?.(task) ?? true} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
