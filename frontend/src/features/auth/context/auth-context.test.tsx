import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-context'
import { loginRequest, fetchCurrentUser } from '@/features/auth/api/auth-api'
import { tokenStore } from '@/lib/api-client'

// Mock api module
vi.mock('@/features/auth/api/auth-api', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  fetchCurrentUser: vi.fn(),
}))

// Mock api-client token storage
vi.mock('@/lib/api-client', () => ({
  setOnAuthExpired: vi.fn(),
  tokenStore: {
    getAccess: vi.fn(),
    getRefresh: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}))

function TestComponent() {
  const { user, status, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? user.username : 'no-user'}</span>
      <button data-testid="login-btn" onClick={() => login({ userNameOrEmail: 'admin', password: 'password' })}>Login</button>
      <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with status unauthenticated when no token exists', async () => {
    vi.mocked(tokenStore.getAccess).mockReturnValue(null)

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
    expect(screen.getByTestId('user').textContent).toBe('no-user')
  })

  it('should authenticate user if token exists and fetchCurrentUser succeeds', async () => {
    vi.mocked(tokenStore.getAccess).mockReturnValue('mock-token')
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@workforce.local',
      role: 'SuperAdmin',
      employeeId: null,
      departmentId: null,
      fullName: 'Super Admin',
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    expect(await screen.findByTestId('status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('admin')
  })

  it('should log in and update state when login is triggered', async () => {
    vi.mocked(tokenStore.getAccess).mockReturnValue(null)
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: '2026-06-13T22:00:00Z',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@workforce.local',
        role: 'SuperAdmin',
        employeeId: null,
        departmentId: null,
        fullName: 'Super Admin',
      }
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    // Initially unauthenticated
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated')

    // Trigger Login
    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    expect(loginRequest).toHaveBeenCalledWith({ userNameOrEmail: 'admin', password: 'password' })
    expect(tokenStore.set).toHaveBeenCalledWith('access-token', 'refresh-token')
    expect(screen.getByTestId('status').textContent).toBe('authenticated')
    expect(screen.getByTestId('user').textContent).toBe('admin')
  })
})
