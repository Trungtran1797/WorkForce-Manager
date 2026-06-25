import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState, TableSkeleton } from '@/components/common/data-state'
import { KanbanBoard } from '@/features/tasks/components/kanban-board'
import { TaskCalendarView } from '@/features/tasks/components/task-calendar-view'
import { TaskGanttView } from '@/features/tasks/components/task-gantt-view'
import { TaskListView } from '@/features/tasks/components/task-list-view'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import {
  useCreateTask,
  useTasks,
  useUpdateTaskStatus,
} from '@/features/tasks/api/task-queries'
import type { TaskStatus } from '@/types/common'
import type { Task, TaskFormValues } from '@/features/tasks/types'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'Todo', label: 'Cần làm' },
  { value: 'InProgress', label: 'Đang thực hiện' },
  { value: 'Review', label: 'Chờ nghiệm thu' },
  { value: 'Done', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
]

export function TaskBoardPage() {
  const { user } = useAuth()
  const canEdit = useCanEdit('Tasks')
  const { data: serverTasks = [], isLoading, isError, refetch } = useTasks()
  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTask()

  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setTasks(serverTasks)
  }, [serverTasks])

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    const projectTerm = projectFilter.trim().toLowerCase()

    return tasks.filter((task) => {
      if (term && !task.code.toLowerCase().includes(term) && !task.title.toLowerCase().includes(term)) {
        return false
      }

      if (
        myTasksOnly &&
        task.assigneeId !== user?.employeeId &&
        task.assignerId !== user?.employeeId
      ) {
        return false
      }

      if (projectTerm && !task.projectCode.toLowerCase().includes(projectTerm)) {
        return false
      }

      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }

      if (monthFilter && !task.dueDate?.startsWith(monthFilter)) {
        return false
      }

      return true
    })
  }, [tasks, search, myTasksOnly, projectFilter, statusFilter, monthFilter, user])

  const handleStatusChange = (taskId: number, status: TaskStatus): void => {
    updateStatus.mutate({ id: taskId, status })
  }

  const handleKanbanTasksChange = (updated: Task[]): void => {
    setTasks((prev) => prev.map((task) => updated.find((item) => item.id === task.id) ?? task))
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
        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã hoặc tên công việc..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Thêm công việc
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={myTasksOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMyTasksOnly((value) => !value)}
        >
          Công việc của tôi
        </Button>

        <Input
          placeholder="Mã dự án..."
          className="w-36"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="month"
          className="w-40"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />

        {(myTasksOnly || projectFilter || statusFilter !== 'all' || monthFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMyTasksOnly(false)
              setProjectFilter('')
              setStatusFilter('all')
              setMonthFilter('')
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
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
            <KanbanBoard
              tasks={filteredTasks}
              onTasksChange={handleKanbanTasksChange}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <TaskListView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <TaskCalendarView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <TaskGanttView tasks={filteredTasks} />
          </TabsContent>
        </Tabs>
      )}

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
    </div>
  )
}
