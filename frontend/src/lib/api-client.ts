/**
 * HTTP client cho WorkForce Manager API.
 * - Tự gắn JWT access token vào header.
 * - Tự refresh token khi gặp 401 (1 lần) rồi retry request gốc.
 * - Bóc tách response envelope { success, data, message, errors } của backend.
 */

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'

const ACCESS_TOKEN_KEY = 'wf_access_token'
const REFRESH_TOKEN_KEY = 'wf_refresh_token'

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  message: string | null
  errors: Record<string, string[]> | null
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]> | null

  constructor(message: string, status: number, errors?: Record<string, string[]> | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

// --- Token store ---
export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

let onAuthExpired: (() => void) | null = null
export function setOnAuthExpired(handler: () => void): void {
  onAuthExpired = handler
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Bỏ qua việc gắn token + auto refresh (dùng cho login / refresh). */
  skipAuth?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return false

  // Đảm bảo chỉ 1 refresh chạy đồng thời.
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const envelope = (await res.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>
      if (!envelope.success || !envelope.data) return false
      tokenStore.set(envelope.data.accessToken, envelope.data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      const token = tokenStore.getAccess()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let response = await doFetch()

  if (response.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      response = await doFetch()
    } else {
      tokenStore.clear()
      onAuthExpired?.()
      throw new ApiError('Phiên đăng nhập đã hết hạn.', 401)
    }
  }

  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    envelope = null
  }

  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.message ?? `Yêu cầu thất bại (${response.status}).`,
      response.status,
      envelope?.errors,
    )
  }

  return envelope.data as T
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body?: unknown, opts?: { skipAuth?: boolean }): Promise<T> =>
    request<T>(path, { method: 'POST', body, skipAuth: opts?.skipAuth }),
  put: <T>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
}
