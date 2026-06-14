import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AttendancePage } from './attendance-page'
import type { AttendanceRecord } from '@/features/attendance/types'

const mockUseMyAttendance = vi.fn()

vi.mock('@/features/attendance/api/attendance-queries', () => ({
  useMyAttendance: () => mockUseMyAttendance(),
  useCheckIn: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCheckOut: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

const sampleRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2026-06-10',
    checkIn: '08:00',
    checkOut: '17:30',
    totalHours: 8.5,
    status: 'Full',
    shiftName: 'Ca hành chính',
    overtimeHours: 0,
    locationValid: true,
  },
]

describe('AttendancePage', () => {
  it('hiển thị nút Check In khi chưa chấm công hôm nay', () => {
    mockUseMyAttendance.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(<AttendancePage />)

    expect(screen.getByRole('button', { name: /Check In/ })).toBeInTheDocument()
  })

  it('hiển thị bảng chấm công khi có dữ liệu', () => {
    mockUseMyAttendance.mockReturnValue({ data: sampleRecords, isLoading: false, isError: false, refetch: vi.fn() })

    render(<AttendancePage />)

    expect(screen.getByText('Ca hành chính')).toBeInTheDocument()
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('17:30')).toBeInTheDocument()
  })

  it('hiển thị empty state khi chưa có dữ liệu chấm công', () => {
    mockUseMyAttendance.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(<AttendancePage />)

    expect(screen.getByText('Chưa có dữ liệu chấm công')).toBeInTheDocument()
  })
})
