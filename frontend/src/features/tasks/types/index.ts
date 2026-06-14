import type { TaskPriority, TaskStatus } from '@/types/common'

export interface Task {
  id: number
  code: string
  title: string
  description: string
  assigneeId: number | null
  assigneeName: string
  assignerId: number | null
  assignerName: string
  priority: TaskPriority
  status: TaskStatus
  startDate: string
  dueDate: string
  progress: number
  projectId: number | null
  projectCode: string
  parentTaskId: number | null
  parentTaskTitle: string | null
  subTaskCount: number
}

export interface TaskAttachment {
  id: number
  fileName: string
  contentType: string
  fileSizeBytes: number
  uploadedByName: string
  createdDate: string
}

export interface TaskComment {
  id: number
  taskId: number
  content: string
  authorId: number
  authorName: string
  createdDate: string
  attachments: TaskAttachment[]
}

export interface TaskFormValues {
  code?: string
  title: string
  description: string
  assigneeId: string
  priority: TaskPriority
  status: TaskStatus
  startDate: string
  dueDate: string
  progress: number
  projectId: string
  parentTaskId?: number | null
}
