import { apiClient, tokenStore, ApiError } from '@/lib/api-client'
import type { WallPost, WallComment, WallGroup } from '@/features/wall/types'

const BASE = '/wall'

export function getWallPosts(options?: {
  pending?: boolean
  scheduled?: boolean
  groupName?: string
  companyOnly?: boolean
}): Promise<WallPost[]> {
  const params = new URLSearchParams()
  if (options?.pending) params.set('pending', 'true')
  if (options?.scheduled) params.set('scheduled', 'true')
  if (options?.groupName) params.set('groupName', options.groupName)
  if (options?.companyOnly) params.set('companyOnly', 'true')
  const qs = params.toString()
  return apiClient.get<WallPost[]>(`${BASE}${qs ? `?${qs}` : ''}`)
}

export async function createWallPost(
  title: string | null,
  content: string,
  files?: File[],
  groupName?: string | null,
  scheduledPublishDate?: string | null,
  isCompanyPost?: boolean,
  pollOptions?: string[],
  pollEndDate?: string | null,
  pollMultipleChoice?: boolean,
  pollAllowAddOptions?: boolean,
  pollAnonymous?: boolean,
  pollHideResultsBeforeVoting?: boolean,
  pollPinToTop?: boolean,
): Promise<WallPost> {
  const formData = new FormData()
  if (title) formData.append('title', title)
  formData.append('content', content)
  if (files) files.forEach((f) => formData.append('files', f))
  if (groupName) formData.append('groupName', groupName)
  if (scheduledPublishDate) formData.append('scheduledPublishDate', scheduledPublishDate)
  if (isCompanyPost) formData.append('isCompanyPost', 'true')

  if (pollOptions && pollOptions.length > 0) {
    pollOptions.forEach((opt) => {
      if (opt.trim()) formData.append('pollOptions', opt.trim())
    })
    if (pollEndDate) formData.append('pollEndDate', pollEndDate)
    if (pollMultipleChoice) formData.append('pollMultipleChoice', 'true')
    if (pollAllowAddOptions) formData.append('pollAllowAddOptions', 'true')
    if (pollAnonymous) formData.append('pollAnonymous', 'true')
    if (pollHideResultsBeforeVoting) formData.append('pollHideResultsBeforeVoting', 'true')
    if (pollPinToTop) formData.append('pollPinToTop', 'true')
  }

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Đăng bài viết thất bại (${response.status}).`)
  const envelope = await response.json()
  return envelope.data as WallPost
}

export async function updateWallPost(
  postId: number,
  title: string | null,
  content: string,
  files?: File[],
  keptAttachments?: string[],
  scheduledPublishDate?: string | null,
  pollOptions?: string[],
  pollEndDate?: string | null,
  pollMultipleChoice?: boolean,
  pollAllowAddOptions?: boolean,
  pollAnonymous?: boolean,
  pollHideResultsBeforeVoting?: boolean,
  pollPinToTop?: boolean,
): Promise<WallPost> {
  const formData = new FormData()
  if (title) formData.append('title', title)
  formData.append('content', content)
  if (files) files.forEach((f) => formData.append('files', f))
  if (keptAttachments) formData.append('keptAttachmentsJson', JSON.stringify(keptAttachments))
  if (scheduledPublishDate) formData.append('scheduledPublishDate', scheduledPublishDate)

  if (pollOptions && pollOptions.length > 0) {
    pollOptions.forEach((opt) => {
      if (opt.trim()) formData.append('pollOptions', opt.trim())
    })
    if (pollEndDate) formData.append('pollEndDate', pollEndDate)
    if (pollMultipleChoice) formData.append('pollMultipleChoice', 'true')
    if (pollAllowAddOptions) formData.append('pollAllowAddOptions', 'true')
    if (pollAnonymous) formData.append('pollAnonymous', 'true')
    if (pollHideResultsBeforeVoting) formData.append('pollHideResultsBeforeVoting', 'true')
    if (pollPinToTop) formData.append('pollPinToTop', 'true')
  }

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/update`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Cập nhật bài viết thất bại (${response.status}).`)
  const envelope = await response.json()
  return envelope.data as WallPost
}

export function deleteWallPost(postId: number): Promise<unknown> {
  return apiClient.post(`${BASE}/${postId}/delete`)
}

export function approveWallPost(postId: number): Promise<WallPost> {
  return apiClient.post<WallPost>(`${BASE}/${postId}/approve`)
}

export function rejectWallPost(postId: number): Promise<WallPost> {
  return apiClient.post<WallPost>(`${BASE}/${postId}/reject`)
}

export function publishNowWallPost(postId: number): Promise<WallPost> {
  return apiClient.post<WallPost>(`${BASE}/${postId}/publish-now`)
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

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/comments`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Bình luận thất bại (${response.status}).`)
  const envelope = await response.json()
  return envelope.data as WallComment
}

export async function downloadWallAttachment(postId: number, fileName: string): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(
    `${API_BASE_URL}${BASE}/download/${postId}/${encodeURIComponent(fileName)}`,
    { method: 'GET', headers },
  )

  if (!response.ok) throw new ApiError(`Tải file thất bại (${response.status}).`, response.status)

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

export function getWallGroups(): Promise<WallGroup[]> {
  return apiClient.get<WallGroup[]>(`${BASE}/groups`)
}

export function createWallGroup(name: string, description?: string): Promise<WallGroup> {
  return apiClient.post<WallGroup>(`${BASE}/groups`, { name, description })
}

export function deleteWallGroup(name: string): Promise<unknown> {
  return apiClient.delete(`${BASE}/groups/${encodeURIComponent(name)}`)
}

export async function voteWallPoll(postId: number, options: string[]): Promise<WallPost> {
  const formData = new FormData()
  if (options) {
    options.forEach((opt) => formData.append('options', opt))
  }

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/vote`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Bình chọn thất bại (${response.status}).`)
  const envelope = await response.json()
  return envelope.data as WallPost
}

export async function addWallPollOption(postId: number, option: string): Promise<WallPost> {
  const formData = new FormData()
  formData.append('option', option)

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}${BASE}/${postId}/add-option`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Thêm lựa chọn thất bại (${response.status}).`)
  const envelope = await response.json()
  return envelope.data as WallPost
}
