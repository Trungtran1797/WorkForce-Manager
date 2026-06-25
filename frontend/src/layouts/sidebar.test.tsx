import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Sidebar } from './sidebar'
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

describe('Sidebar', () => {
  it('chỉ hiển thị nav item có quyền khác None', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({
        Dashboard: 'View',
        Employees: 'None',
        Tasks: 'Edit',
        PermissionMatrix: 'None',
      }),
    } as ReturnType<typeof useAuth>)

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    // Module với quyền View/Edit phải hiển thị
    expect(screen.getByText('Tổng quan')).toBeInTheDocument()
    expect(screen.getByText('Công việc')).toBeInTheDocument()

    // Module với quyền None không được hiển thị
    expect(screen.queryByText('Nhân viên')).not.toBeInTheDocument()
    expect(screen.queryByText('Phân quyền')).not.toBeInTheDocument()
  })

  it('hiển thị toàn bộ nav item khi user có quyền Edit trên mọi module', () => {
    const allEdit: AuthUser['permissions'] = {
      Dashboard: 'Edit',
      Employees: 'Edit',
      Departments: 'Edit',
      Projects: 'Edit',
      Tasks: 'Edit',
      Attendance: 'Edit',
      Shifts: 'Edit',
      Overtime: 'Edit',
      Leave: 'Edit',
      Contracts: 'Edit',
      Payroll: 'Edit',
      SalaryConfigs: 'Edit',
      Payslips: 'Edit',
      Okrs: 'Edit',
      Performance: 'Edit',
      Training: 'Edit',
      OfficeLocations: 'Edit',
      Reports: 'Edit',
      Notifications: 'Edit',
      PermissionMatrix: 'Edit',
    }
    vi.mocked(useAuth).mockReturnValue({ user: mockUser(allEdit) } as ReturnType<typeof useAuth>)

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Nhân viên')).toBeInTheDocument()
    expect(screen.getByText('Phân quyền')).toBeInTheDocument()
  })
})
