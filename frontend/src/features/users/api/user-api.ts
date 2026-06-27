import { apiClient } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/common'
import type { CreateUserPayload, User, UserListParams } from '@/features/users/types'

const BASE = '/users'

export function getUsers(params: UserListParams): Promise<PaginatedResult<User>> {
  const search = new URLSearchParams()
  search.set('pageNumber', String(params.pageNumber))
  search.set('pageSize', String(params.pageSize))
  if (params.search) search.set('search', params.search)
  if (params.role) search.set('role', params.role)
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive))
  if (params.sortBy) search.set('sortBy', params.sortBy)
  if (params.isDescending !== undefined) search.set('isDescending', String(params.isDescending))

  return apiClient.get<PaginatedResult<User>>(`${BASE}?${search.toString()}`)
}

export function createUser(payload: CreateUserPayload): Promise<User> {
  return apiClient.post<User>(BASE, payload)
}

export function updateUserStatus(id: number, isActive: boolean): Promise<void> {
  return apiClient.put<void>(`${BASE}/${id}/status`, { isActive })
}

export function updateUserRole(id: number, role: string): Promise<void> {
  return apiClient.put<void>(`${BASE}/${id}/role`, { role })
}

export function resetUserPassword(id: number, password: string): Promise<void> {
  return apiClient.put<void>(`${BASE}/${id}/reset-password`, { newPassword: password })
}
