import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { KanbanBoard } from '@/features/tasks/components/kanban-board'
import { TaskCalendarView } from '@/features/tasks/components/task-calendar-view'
import { TaskGanttView } from '@/features/tasks/components/task-gantt-view'
import { TaskListView } from '@/features/tasks/components/task-list-view'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import {
  useCreateTask,
  useTasks,
  useUpdateTaskStatus,
} from '@/features/tasks/api/task-queries'
import type { TaskStatus } from '@/types/common'
import type { Task, TaskFormValues } from '@/features/tasks/types'

export function TaskBoardPage() {
  const { data: serverTasks = [], isLoading, isError, refetch } = useTasks()
  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTask()

  const [tasks, setTasks] = useState<Task[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setTasks(serverTasks)
  }, [serverTasks])

  const handleStatusChange = (taskId: number, status: TaskStatus): void => {
    updateStatus.mutate({ id: taskId, status })
  }

  const handleCreate = async (values: TaskFormValues): Promise<void> => {
    await createTask.mutateAsync(values)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Công việc</h1>
          <p className="text-sm text-muted-foreground">Quản lý và theo dõi tiến độ công việc</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Thêm công việc
        </Button>
      </div>

      {isLoading && (
        <Card className="p-0">
          <TableSkeleton rows={6} columns={4} />
        </Card>
      )}

      {isError && (
        <Card className="p-0">
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      )}

      {!isLoading && !isError && (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard tasks={tasks} onTasksChange={setTasks} onStatusChange={handleStatusChange} />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <TaskListView tasks={tasks} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <TaskCalendarView tasks={tasks} />
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <TaskGanttView tasks={tasks} />
          </TabsContent>
        </Tabs>
      )}

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
    </div>
  )
}
