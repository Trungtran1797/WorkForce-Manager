import { apiClient, ApiError, tokenStore, type ApiEnvelope } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/common'
import type { ProjectComment } from '@/features/projects/types'

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'

export function getProjectComments(
  projectId: number,
  pageNumber: number,
  pageSize: number,
): Promise<PaginatedResult<ProjectComment>> {
  const params = new URLSearchParams()
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))
  return apiClient.get<PaginatedResult<ProjectComment>>(
    `/projects/${projectId}/comments?${params.toString()}`,
  )
}

export async function addProjectComment(
  projectId: number,
  content: string,
  files: File[],
): Promise<ProjectComment> {
  const formData = new FormData()
  formData.append('content', content)
  files.forEach((file) => formData.append('files', file))

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/comments`, {
    method: 'POST',
    headers,
    body: formData,
  })

  let envelope: ApiEnvelope<ProjectComment> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<ProjectComment>
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

export function deleteProjectComment(projectId: number, commentId: number): Promise<unknown> {
  return apiClient.delete(`/projects/${projectId}/comments/${commentId}`)
}

export function deleteProjectAttachment(projectId: number, attachmentId: number): Promise<unknown> {
  return apiClient.delete(`/projects/${projectId}/attachments/${attachmentId}`)
}

export async function downloadProjectAttachment(
  projectId: number,
  attachmentId: number,
  fileName: string,
): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/attachments/${attachmentId}/download`,
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
