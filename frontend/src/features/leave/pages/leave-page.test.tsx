import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LeavePage } from './leave-page'
import type { LeaveRequest } from '@/features/leave/types'

const sampleRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeName: 'Nguyễn Văn A',
    leaveType: 'Annual',
    startDate: '2026-06-20',
    endDate: '2026-06-21',
    reason: 'Việc gia đình',
    status: 'PendingManager',
  },
]

const mockUseMyLeaveRequests = vi.fn()
const mockUsePendingLeaveRequests = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/features/leave/api/leave-queries', () => ({
  useMyLeaveRequests: () => mockUseMyLeaveRequests(),
  usePendingLeaveRequests: () => mockUsePendingLeaveRequests(),
  useCreateLeaveRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useApproveLeaveRequest: () => ({ mutateAsync: vi.fn(), isPending: false, variables: undefined }),
  useRejectLeaveRequest: () => ({ mutateAsync: vi.fn(), isPending: false, variables: undefined }),
}))

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('LeavePage', () => {
  it('hiển thị danh sách đơn nghỉ phép của nhân viên', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Employee' } })
    mockUseMyLeaveRequests.mockReturnValue({ data: sampleRequests, isLoading: false, isError: false, refetch: vi.fn() })
    mockUsePendingLeaveRequests.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(<LeavePage />)

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Việc gia đình')).toBeInTheDocument()
  })

  it('hiển thị tab "Cần duyệt" cho Manager/SuperAdmin', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Manager' } })
    mockUseMyLeaveRequests.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    mockUsePendingLeaveRequests.mockReturnValue({ data: sampleRequests, isLoading: false, isError: false, refetch: vi.fn() })

    render(<LeavePage />)

    expect(screen.getByRole('tab', { name: /Cần duyệt/ })).toBeInTheDocument()
  })

  it('hiển thị empty state khi không có đơn nghỉ phép', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Employee' } })
    mockUseMyLeaveRequests.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })
    mockUsePendingLeaveRequests.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(<LeavePage />)

    expect(screen.getByText('Chưa có đơn nghỉ phép')).toBeInTheDocument()
  })
})
