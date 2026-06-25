import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { usePermission, useCanEdit, useCanView } from './use-permission'
import { useAuth } from '@/features/auth/context/auth-context'
import type { AuthUser } from '@/features/auth/types'

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}))

function mockUser(permissions: AuthUser['permissions']): AuthUser {
  return {
    id: 1,
    username: 'user',
    email: 'user@workforce.local',
    role: 'Employee',
    employeeId: 1,
    departmentId: 1,
    fullName: 'Test User',
    permissions,
  }
}

describe('usePermission / useCanEdit / useCanView', () => {
  it('should return Edit and true for both can-edit/can-view when permission is Edit', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser({ Employees: 'Edit' }) } as ReturnType<typeof useAuth>)

    expect(renderHook(() => usePermission('Employees')).result.current).toBe('Edit')
    expect(renderHook(() => useCanEdit('Employees')).result.current).toBe(true)
    expect(renderHook(() => useCanView('Employees')).result.current).toBe(true)
  })

  it('should return View and canEdit=false, canView=true when permission is View', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser({ Employees: 'View' }) } as ReturnType<typeof useAuth>)

    expect(renderHook(() => usePermission('Employees')).result.current).toBe('View')
    expect(renderHook(() => useCanEdit('Employees')).result.current).toBe(false)
    expect(renderHook(() => useCanView('Employees')).result.current).toBe(true)
  })

  it('should return None and both false when module has no entry in permissions', () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser({ Employees: 'Edit' }) } as ReturnType<typeof useAuth>)

    expect(renderHook(() => usePermission('Payroll')).result.current).toBe('None')
    expect(renderHook(() => useCanEdit('Payroll')).result.current).toBe(false)
    expect(renderHook(() => useCanView('Payroll')).result.current).toBe(false)
  })

  it('should return None and both false when user is null', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuth>)

    expect(renderHook(() => usePermission('Employees')).result.current).toBe('None')
    expect(renderHook(() => useCanEdit('Employees')).result.current).toBe(false)
    expect(renderHook(() => useCanView('Employees')).result.current).toBe(false)
  })
})
