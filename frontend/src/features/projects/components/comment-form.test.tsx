import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { CommentForm } from './comment-form'

const mockMutateAsync = vi.fn()
const mockToast = vi.fn()

vi.mock('@/features/projects/api/project-discussion-queries', () => ({
  useAddProjectComment: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}))

describe('CommentForm', () => {
  it('hiển thị textarea và nút gửi', () => {
    render(<CommentForm projectId={1} />)

    expect(
      screen.getByPlaceholderText('Viết bình luận, cập nhật tiến độ hoặc đính kèm tài liệu...'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đính kèm file/ })).toBeInTheDocument()
  })

  it('không gửi khi nội dung trống và hiển thị cảnh báo', () => {
    render(<CommentForm projectId={1} />)

    fireEvent.click(screen.getByRole('button', { name: /Gửi/ }))

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Vui lòng nhập nội dung' }),
    )
  })

  it('gọi mutateAsync với nội dung đã nhập', async () => {
    mockMutateAsync.mockResolvedValueOnce({})
    render(<CommentForm projectId={1} />)

    const textarea = screen.getByPlaceholderText(
      'Viết bình luận, cập nhật tiến độ hoặc đính kèm tài liệu...',
    )
    fireEvent.change(textarea, { target: { value: 'Cập nhật tiến độ tuần này' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi/ }))

    expect(mockMutateAsync).toHaveBeenCalledWith({
      content: 'Cập nhật tiến độ tuần này',
      files: [],
    })
  })
})
