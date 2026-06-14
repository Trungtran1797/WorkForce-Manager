import { apiClient, ApiError, tokenStore, type ApiEnvelope } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/common'
import type { TaskComment } from '@/features/tasks/types'

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'

export function getTaskComments(
  taskId: number,
  pageNumber: number,
  pageSize: number,
): Promise<PaginatedResult<TaskComment>> {
  const params = new URLSearchParams()
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))
  return apiClient.get<PaginatedResult<TaskComment>>(
    `/tasks/${taskId}/comments?${params.toString()}`,
  )
}

export async function addTaskComment(
  taskId: number,
  content: string,
  files: File[],
): Promise<TaskComment> {
  const formData = new FormData()
  formData.append('content', content)
  files.forEach((file) => formData.append('files', file))

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers,
    body: formData,
  })

  let envelope: ApiEnvelope<TaskComment> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<TaskComment>
  } catch {
    envelope = null
  }

  if (!response.ok || !envelope?.success || !envelope.data) {
    throw new ApiError(
      envelope?.message ?? `Gửi bình luận thất bại (${response.status}).`,
      response.status,
      envelope?.errors,
    )
  }

  return envelope.data
}

export function deleteTaskComment(taskId: number, commentId: number): Promise<unknown> {
  return apiClient.delete(`/tasks/${taskId}/comments/${commentId}`)
}

export function deleteTaskAttachment(taskId: number, attachmentId: number): Promise<unknown> {
  return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
}

export async function downloadTaskAttachment(
  taskId: number,
  attachmentId: number,
  fileName: string,
): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/attachments/${attachmentId}/download`,
    { method: 'GET', headers },
  )

  if (!response.ok) {
    throw new ApiError(`Tải file thất bại (${response.status}).`, response.status)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
