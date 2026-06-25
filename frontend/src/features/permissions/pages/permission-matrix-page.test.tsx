import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { PermissionMatrixPage } from './permission-matrix-page'
import { useGetPermissionMatrix, useUpdatePermissionMatrix } from '@/features/permissions/api/permission-queries'
import type { PermissionMatrixDto } from '@/features/permissions/types'

vi.mock('@/features/permissions/api/permission-queries', () => ({
  useGetPermissionMatrix: vi.fn(),
  useUpdatePermissionMatrix: vi.fn(),
}))

const sampleMatrix: PermissionMatrixDto = {
  rolePermissions: [
    { role: 'SuperAdmin', module: 'Dashboard', level: 'Edit' },
    { role: 'Manager', module: 'Dashboard', level: 'View' },
    { role: 'Employee', module: 'Dashboard', level: 'View' },
    { role: 'SuperAdmin', module: 'Reports', level: 'Edit' },
    { role: 'Manager', module: 'Reports', level: 'View' },
    { role: 'Employee', module: 'Reports', level: 'None' },
  ],
  departmentOverrides: [
    { departmentId: 1, departmentName: 'Phòng Kế toán', module: 'Reports', level: 'Edit' },
  ],
  roles: ['SuperAdmin', 'Manager', 'Employee'],
  modules: ['Dashboard', 'Reports'],
  levels: ['None', 'View', 'Edit'],
  departments: [{ id: 1, name: 'Phòng Kế toán' }],
}

describe('PermissionMatrixPage', () => {
  it('hiển thị cả 2 tab với dữ liệu ma trận', () => {
    vi.mocked(useGetPermissionMatrix).mockReturnValue({
      data: sampleMatrix,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetPermissionMatrix>)

    vi.mocked(useUpdatePermissionMatrix).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePermissionMatrix>)

    render(<PermissionMatrixPage />)

    // Tab labels
    expect(screen.getByText('Theo vai trò')).toBeInTheDocument()
    expect(screen.getByText('Theo phòng ban')).toBeInTheDocument()

    // Role tab (default) shows module rows + role columns
    expect(screen.getByText('Tổng quan')).toBeInTheDocument() // Dashboard label
    expect(screen.getByText('Báo cáo')).toBeInTheDocument() // Reports label
    expect(screen.getAllByText('SuperAdmin').length).toBeGreaterThan(0)
  })

  it('gọi mutation update khi nhấn nút Lưu', () => {
    const mutateMock = vi.fn()

    vi.mocked(useGetPermissionMatrix).mockReturnValue({
      data: sampleMatrix,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGetPermissionMatrix>)

    vi.mocked(useUpdatePermissionMatrix).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePermissionMatrix>)

    render(<PermissionMatrixPage />)

    fireEvent.click(screen.getByRole('button', { name: /Lưu/i }))

    expect(mutateMock).toHaveBeenCalledTimes(1)
    expect(mutateMock).toHaveBeenCalledWith({
      rolePermissions: sampleMatrix.rolePermissions,
      departmentOverrides: sampleMatrix.departmentOverrides,
    })
  })
})
