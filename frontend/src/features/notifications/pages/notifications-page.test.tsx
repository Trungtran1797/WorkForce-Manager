import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { NotificationsPage } from './notifications-page'
import type { NotificationItem } from '@/features/notifications/types'

const mockUseNotifications = vi.fn()

vi.mock('@/features/notifications/api/notification-queries', () => ({
  useNotifications: () => mockUseNotifications(),
  useMarkNotificationAsRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsAsRead: () => ({ mutate: vi.fn(), isPending: false }),
}))

const sampleNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Công việc mới được giao',
    message: 'Bạn được giao công việc "Thiết kế giao diện"',
    type: 'task',
    isRead: false,
    link: '/tasks',
    createdAt: '2026-06-14T08:00:00Z',
  },
]

describe('NotificationsPage', () => {
  it('hiển thị danh sách thông báo và số lượng chưa đọc', () => {
    mockUseNotifications.mockReturnValue({ data: sampleNotifications, isLoading: false, isError: false, refetch: vi.fn() })

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Công việc mới được giao')).toBeInTheDocument()
    expect(screen.getByText('Bạn có 1 thông báo chưa đọc.')).toBeInTheDocument()
  })

  it('hiển thị empty state khi không có thông báo', () => {
    mockUseNotifications.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Chưa có thông báo')).toBeInTheDocument()
  })
})
