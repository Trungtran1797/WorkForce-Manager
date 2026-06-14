import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DiscussionList } from './discussion-list'
import type { PaginatedResult } from '@/types/common'
import type { ProjectComment } from '@/features/projects/types'

const mockUseProjectComments = vi.fn()

vi.mock('@/features/projects/api/project-discussion-queries', () => ({
  useProjectComments: (...args: unknown[]) => mockUseProjectComments(...args),
  useDeleteProjectComment: () => ({ mutate: vi.fn() }),
  useDeleteProjectAttachment: () => ({ mutate: vi.fn() }),
  downloadProjectAttachment: vi.fn(),
}))

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'SuperAdmin', employeeId: null, departmentId: null, fullName: 'Admin' },
    hasRole: (...roles: string[]) => roles.includes('SuperAdmin'),
  }),
}))

const sampleComment: ProjectComment = {
  id: 1,
  projectId: 1,
  content: 'Tiến độ dự án đang đúng kế hoạch.',
  authorId: 2,
  authorName: 'Nguyễn Văn A',
  createdDate: '2026-06-14T09:30:00Z',
  attachments: [
    {
      id: 10,
      fileName: 'bao-cao.pdf',
      contentType: 'application/pdf',
      fileSizeBytes: 204800,
      uploadedByName: 'Nguyễn Văn A',
      createdDate: '2026-06-14T09:30:00Z',
    },
  ],
}

describe('DiscussionList', () => {
  it('hiển thị danh sách bình luận và file đính kèm', () => {
    const data: PaginatedResult<ProjectComment> = {
      items: [sampleComment],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    }
    mockUseProjectComments.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<DiscussionList projectId={1} />)

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Tiến độ dự án đang đúng kế hoạch.')).toBeInTheDocument()
    expect(screen.getByText('bao-cao.pdf')).toBeInTheDocument()
  })

  it('hiển thị trạng thái trống khi chưa có bình luận', () => {
    const data: PaginatedResult<ProjectComment> = {
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    }
    mockUseProjectComments.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<DiscussionList projectId={1} />)

    expect(screen.getByText('Chưa có thảo luận nào')).toBeInTheDocument()
  })
})
