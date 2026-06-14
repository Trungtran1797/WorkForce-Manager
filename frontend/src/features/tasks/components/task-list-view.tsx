import { useState } from 'react'
import { ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/data-state'
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { useTasks } from '@/features/tasks/api/task-queries'
import { TaskDetailDialog } from '@/features/tasks/components/task-detail-dialog'
import type { Task } from '@/features/tasks/types'

export function TaskListView({ tasks }: { tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleOpenDetail = (task: Task): void => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={ListChecks} title="Chưa có công việc nào" description="Tạo công việc mới để bắt đầu theo dõi." />
      </Card>
    )
  }

  const topLevelTasks = tasks.filter((task) => task.parentTaskId === null)

  return (
    <>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã CV</TableHead>
              <TableHead>Tên công việc</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Người giao</TableHead>
              <TableHead>Độ ưu tiên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>% hoàn thành</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topLevelTasks.map((task) => (
              <TaskRow key={task.id} task={task} onOpenDetail={handleOpenDetail} />
            ))}
          </TableBody>
        </Table>
      </Card>

      <TaskDetailDialog task={selectedTask} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  )
}

function TaskRow({ task, onOpenDetail }: { task: Task; onOpenDetail: (task: Task) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasSubtasks = task.subTaskCount > 0

  const { data: subtasks = [], isLoading } = useTasks(
    expanded ? { parentTaskId: task.id } : {},
  )

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{task.code}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label={expanded ? 'Thu gọn công việc con' : 'Mở rộng công việc con'}
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
            )}
            <button
              type="button"
              className="text-left hover:underline hover:text-primary"
              onClick={() => onOpenDetail(task)}
            >
              {task.title}
            </button>
            {hasSubtasks && (
              <Badge variant="gray">{task.subTaskCount} công việc con</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{task.assigneeName}</TableCell>
        <TableCell className="text-muted-foreground">{task.assignerName}</TableCell>
        <TableCell>
          <TaskPriorityBadge priority={task.priority} />
        </TableCell>
        <TableCell>
          <TaskStatusBadge status={task.status} />
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
        <TableCell>{task.progress}%</TableCell>
      </TableRow>

      {expanded && isLoading && (
        <TableRow>
          <TableCell colSpan={8}>
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải công việc con...
            </div>
          </TableCell>
        </TableRow>
      )}

      {expanded &&
        !isLoading &&
        subtasks.map((subtask) => (
          <TableRow key={subtask.id} className="bg-muted/30">
            <TableCell className="pl-6 font-medium">{subtask.code}</TableCell>
            <TableCell className="pl-6 text-muted-foreground">
              ↳{' '}
              <button
                type="button"
                className="text-left hover:underline hover:text-primary"
                onClick={() => onOpenDetail(subtask)}
              >
                {subtask.title}
              </button>
            </TableCell>
            <TableCell>{subtask.assigneeName}</TableCell>
            <TableCell className="text-muted-foreground">{subtask.assignerName}</TableCell>
            <TableCell>
              <TaskPriorityBadge priority={subtask.priority} />
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={subtask.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(subtask.dueDate)}</TableCell>
            <TableCell>{subtask.progress}%</TableCell>
          </TableRow>
        ))}
    </>
  )
}
