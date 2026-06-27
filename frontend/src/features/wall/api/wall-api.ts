import { apiClient, tokenStore, ApiError } from '@/lib/api-client'
import type { WallPost, WallComment } from '@/features/wall/types'

const BASE = '/wall'

export function getWallPosts(): Promise<WallPost[]> {
  return apiClient.get<WallPost[]>(BASE)
}

export async function createWallPost(
  title: string | null,
  content: string,
  files?: File[],
  groupName?: string | null,
  scheduledPublishDate?: string | null,
): Promise<WallPost> {
  const formData = new FormData()
  if (title) formData.append('title', title)
  formData.append('content', content)
  if (files) {
    files.forEach((f) => formData.append('files', f))
  }
  if (groupName) formData.append('groupName', groupName)
  if (scheduledPublishDate) formData.append('scheduledPublishDate', scheduledPublishDate)

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Đăng bài viết thất bại (${response.status}).`)
  }

  const envelope = await response.json()
  return envelope.data as WallPost
}

export async function updateWallPost(
  postId: number,
  title: string | null,
  content: string,
  files?: File[],
  keptAttachments?: string[],
): Promise<WallPost> {
  const formData = new FormData()
  if (title) formData.append('title', title)
  formData.append('content', content)
  if (files) {
    files.forEach((f) => formData.append('files', f))
  }
  if (keptAttachments) {
    formData.append('keptAttachmentsJson', JSON.stringify(keptAttachments))
  }

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/update`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Cập nhật bài viết thất bại (${response.status}).`)
  }

  const envelope = await response.json()
  return envelope.data as WallPost
}

export function deleteWallPost(postId: number): Promise<unknown> {
  return apiClient.post(`${BASE}/${postId}/delete`)
}

export function approveWallPost(postId: number): Promise<WallPost> {
  return apiClient.post<WallPost>(`${BASE}/${postId}/approve`)
}

export function toggleWallPostLike(postId: number): Promise<WallPost> {
  return apiClient.post<WallPost>(`${BASE}/${postId}/like`)
}

export async function addWallPostComment(postId: number, content: string): Promise<WallComment> {
  const formData = new FormData()
  formData.append('content', content)

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/comments`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Bình luận thất bại (${response.status}).`)
  }

  const envelope = await response.json()
  return envelope.data as WallComment
}

export async function downloadWallAttachment(postId: number, fileName: string): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(
    `${API_BASE_URL}${BASE}/download/${postId}/${encodeURIComponent(fileName)}`,
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
