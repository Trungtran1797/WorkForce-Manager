import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { DepartmentListPage } from './department-list-page'
import type { Department } from '@/features/departments/types'

const sampleDepartments: Department[] = [
  {
    id: 1,
    name: 'Văn phòng',
    managerId: 1,
    managerName: 'Nguyễn Văn A',
    employeeCount: 20,
    description: 'Khối văn phòng',
    icon: 'briefcase',
    colorVariant: 'primary',
    parentDepartmentId: null,
    parentDepartmentName: null,
  },
  {
    id: 2,
    name: 'Phòng Kế toán',
    managerId: 2,
    managerName: 'Trần Thị B',
    employeeCount: 5,
    description: 'Quản lý tài chính',
    icon: 'calculator',
    colorVariant: 'success',
    parentDepartmentId: 1,
    parentDepartmentName: 'Văn phòng',
  },
  {
    id: 3,
    name: 'Nhà máy',
    managerId: 3,
    managerName: 'Lê Văn C',
    employeeCount: 50,
    description: 'Khối sản xuất',
    icon: 'users',
    colorVariant: 'warning',
    parentDepartmentId: null,
    parentDepartmentName: null,
  },
]

const mockUseDepartments = vi.fn()

vi.mock('@/features/departments/api/department-queries', () => ({
  useDepartments: () => mockUseDepartments(),
  useCreateDepartment: () => ({ mutateAsync: vi.fn() }),
  useUpdateDepartment: () => ({ mutateAsync: vi.fn() }),
  useDeleteDepartment: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/features/employees/api/employee-queries', () => ({
  useEmployees: () => ({ data: { items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 1 } }),
}))

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { role: 'SuperAdmin', permissions: { Departments: 'Edit' } } }),
}))

describe('DepartmentListPage', () => {
  it('hiển thị phòng ban được nhóm theo khối cấp cao nhất', () => {
    mockUseDepartments.mockReturnValue({
      data: sampleDepartments,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DepartmentListPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Văn phòng' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nhà máy' })).toBeInTheDocument()
    expect(screen.getByText('Phòng Kế toán')).toBeInTheDocument()
    expect(screen.getAllByText('Khối').length).toBeGreaterThanOrEqual(2)
  })

  it('hiển thị empty state khi chưa có phòng ban', () => {
    mockUseDepartments.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DepartmentListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Chưa có phòng ban nào')).toBeInTheDocument()
  })
})
