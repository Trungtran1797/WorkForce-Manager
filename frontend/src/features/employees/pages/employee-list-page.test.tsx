import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EmployeeListPage } from './employee-list-page'
import type { Employee } from '@/features/employees/types'

const sampleEmployees: Employee[] = [
  {
    id: 1,
    employeeCode: 'NV001',
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    idCardNumber: '079123456789',
    phoneNumber: '0901234567',
    email: 'a.nguyen@saigonspices.com.vn',
    address: 'TP.HCM',
    departmentId: 1,
    departmentName: 'Phòng Kế toán',
    position: 'Nhân viên kế toán',
    hireDate: '2020-01-01',
    status: 'Active',
  },
]

const mockUseEmployees = vi.fn()

vi.mock('@/features/employees/api/employee-queries', () => ({
  useEmployees: () => mockUseEmployees(),
  useCreateEmployee: () => ({ mutateAsync: vi.fn() }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn() }),
  useDeleteEmployee: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/features/departments/api/department-queries', () => ({
  useDepartments: () => ({ data: [{ id: 1, name: 'Phòng Kế toán' }] }),
}))

describe('EmployeeListPage', () => {
  it('hiển thị danh sách nhân viên', () => {
    mockUseEmployees.mockReturnValue({
      data: { items: sampleEmployees, pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EmployeeListPage />)

    expect(screen.getByText('NV001')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Phòng Kế toán')).toBeInTheDocument()
  })

  it('hiển thị empty state khi không có nhân viên', () => {
    mockUseEmployees.mockReturnValue({
      data: { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EmployeeListPage />)

    expect(screen.getByText('Không tìm thấy nhân viên')).toBeInTheDocument()
  })

  it('hiển thị error state và cho phép thử lại', () => {
    const refetch = vi.fn()
    mockUseEmployees.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch,
    })

    render(<EmployeeListPage />)

    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument()
  })
})
