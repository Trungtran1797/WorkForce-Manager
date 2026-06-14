import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from '@/features/tasks/api/task-api'
import type { TaskStatus } from '@/types/common'
import type { TaskFormValues } from '@/features/tasks/types'

const TASKS_KEY = ['tasks'] as const

interface TaskFilter {
  projectId?: number
  assigneeId?: number
  status?: string
  search?: string
  parentTaskId?: number
}

export function useTasks(filter: TaskFilter = {}) {
  return useQuery({
    queryKey: [...TASKS_KEY, filter],
    queryFn: () => getTasks(filter),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: TaskFormValues) => createTask(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: TaskFormValues }) => updateTask(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, progress }: { id: number; status: TaskStatus; progress?: number }) =>
      updateTaskStatus(id, status, progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}
