import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addTaskComment,
  deleteTaskAttachment,
  deleteTaskComment,
  getTaskComments,
} from '@/features/tasks/api/task-discussion-api'

const TASK_COMMENTS_KEY = ['task-comments'] as const

export function useTaskComments(taskId: number, pageNumber: number, pageSize: number) {
  return useQuery({
    queryKey: [...TASK_COMMENTS_KEY, taskId, pageNumber, pageSize],
    queryFn: () => getTaskComments(taskId, pageNumber, pageSize),
    enabled: Number.isFinite(taskId) && taskId > 0,
  })
}

export function useAddTaskComment(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, files }: { content: string; files: File[] }) =>
      addTaskComment(taskId, content, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...TASK_COMMENTS_KEY, taskId] }),
  })
}

export function useDeleteTaskComment(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => deleteTaskComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...TASK_COMMENTS_KEY, taskId] }),
  })
}

export function useDeleteTaskAttachment(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => deleteTaskAttachment(taskId, attachmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...TASK_COMMENTS_KEY, taskId] }),
  })
}

export { downloadTaskAttachment } from '@/features/tasks/api/task-discussion-api'
