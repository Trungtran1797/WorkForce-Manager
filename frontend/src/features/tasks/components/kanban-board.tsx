import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import { KanbanColumn } from '@/features/tasks/components/kanban-column'
import { KanbanTaskCard } from '@/features/tasks/components/kanban-task-card'
import { canEditTask } from '@/features/tasks/lib/permissions'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import type { Task } from '@/features/tasks/types'
import type { TaskStatus } from '@/types/common'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'Todo', title: 'Cần làm' },
  { status: 'InProgress', title: 'Đang thực hiện' },
  { status: 'Review', title: 'Chờ nghiệm thu' },
  { status: 'Done', title: 'Hoàn thành' },
  { status: 'Cancelled', title: 'Đã hủy' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
  onStatusChange?: (taskId: number, status: TaskStatus) => void
}

export function KanbanBoard({ tasks, onTasksChange, onStatusChange }: KanbanBoardProps) {
  const { user } = useAuth()
  const canEditTasksModule = useCanEdit('Tasks')
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent): void => {
    const task = tasks.find((item) => item.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) {
      return
    }

    const activeTaskItem = tasks.find((item) => item.id === active.id)

    if (!activeTaskItem || !(canEditTasksModule || canEditTask(activeTaskItem, user))) {
      return
    }

    const overId = over.id
    const targetStatus = COLUMNS.find((column) => column.status === overId)?.status

    if (targetStatus && activeTaskItem.status !== targetStatus) {
      onTasksChange(
        tasks.map((item) =>
          item.id === activeTaskItem.id ? { ...item, status: targetStatus } : item
        )
      )
      onStatusChange?.(activeTaskItem.id, targetStatus)
      return
    }

    const overTaskItem = tasks.find((item) => item.id === overId)

    if (overTaskItem && activeTaskItem.status !== overTaskItem.status) {
      onTasksChange(
        tasks.map((item) =>
          item.id === activeTaskItem.id ? { ...item, status: overTaskItem.status } : item
        )
      )
      onStatusChange?.(activeTaskItem.id, overTaskItem.status)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={tasks.filter((task) => task.status === column.status)}
            canEditTask={(task) => canEditTasksModule || canEditTask(task, user)}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <KanbanTaskCard task={activeTask} />}</DragOverlay>
    </DndContext>
  )
}
