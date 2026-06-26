import { apiClient } from '@/lib/api-client'
import type { TaskStatus } from '@/types/common'
import type { Task, TaskFormValues } from '@/features/tasks/types'

const BASE = '/tasks'

interface TaskFilter {
  projectId?: number
  assigneeId?: number
  status?: string
  search?: string
  parentTaskId?: number
}

function toPayload(values: TaskFormValues) {
  const ids = values.assigneeIds?.length
    ? values.assigneeIds
    : values.assigneeId
    ? [Number(values.assigneeId)]
    : []
  return {
    code: values.code,
    title: values.title,
    description: values.description,
    assigneeId: ids[0] ?? null,
    assignerIds: null,
    assigneeIds: ids,
    priority: values.priority,
    status: values.status,
    startDate: values.startDate || null,
    dueDate: values.dueDate || null,
    progress: values.progress,
    projectId: values.projectId ? Number(values.projectId) : null,
    parentTaskId: values.parentTaskId ?? null,
  }
}

export function getTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filter.projectId) params.set('projectId', String(filter.projectId))
  if (filter.assigneeId) params.set('assigneeId', String(filter.assigneeId))
  if (filter.status) params.set('status', filter.status)
  if (filter.search) params.set('search', filter.search)
  if (filter.parentTaskId) params.set('parentTaskId', String(filter.parentTaskId))
  const qs = params.toString()
  return apiClient.get<Task[]>(qs ? `${BASE}?${qs}` : BASE)
}

export function createTask(values: TaskFormValues): Promise<Task> {
  return apiClient.post<Task>(BASE, toPayload(values))
}

export function updateTask(id: number, values: TaskFormValues): Promise<Task> {
  return apiClient.put<Task>(`${BASE}/${id}`, { id, ...toPayload(values) })
}

export function updateTaskStatus(id: number, status: TaskStatus, progress?: number): Promise<Task> {
  return apiClient.patch<Task>(`${BASE}/${id}/status`, { status, progress })
}

export function deleteTask(id: number): Promise<unknown> {
  return apiClient.delete(`${BASE}/${id}`)
}
