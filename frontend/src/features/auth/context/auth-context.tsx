import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { setOnAuthExpired, tokenStore } from '@/lib/api-client'
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/features/auth/api/auth-api'
import type { AuthUser, LoginRequest, UserRole } from '@/features/auth/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const handleExpired = useCallback(() => {
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    setOnAuthExpired(handleExpired)
  }, [handleExpired])

  // Khôi phục phiên khi tải lại trang.
  useEffect(() => {
    let active = true
    const restore = async (): Promise<void> => {
      if (!tokenStore.getAccess()) {
        setStatus('unauthenticated')
        return
      }
      try {
        const current = await fetchCurrentUser()
        if (active) {
          setUser(current)
          setStatus('authenticated')
        }
      } catch {
        if (active) {
          tokenStore.clear()
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }
    void restore()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    const result = await loginRequest(payload)
    tokenStore.set(result.accessToken, result.refreshToken)
    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest()
    tokenStore.clear()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, hasRole }),
    [user, status, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>.')
  }
  return ctx
}
