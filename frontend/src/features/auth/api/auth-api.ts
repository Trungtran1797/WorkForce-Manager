import { apiClient, tokenStore } from '@/lib/api-client'
import type { AuthResponse, AuthUser, LoginRequest } from '@/features/auth/types'

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload, { skipAuth: true })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/auth/me')
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return
  try {
    await apiClient.post('/auth/logout', { refreshToken })
  } catch {
    // Bỏ qua lỗi logout phía server, vẫn xóa token local.
  }
}
