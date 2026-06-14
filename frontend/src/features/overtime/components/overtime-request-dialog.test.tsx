import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { OvertimeRequestDialog } from './overtime-request-dialog'

describe('OvertimeRequestDialog', () => {
  it('hiển thị tiêu đề khi mở', () => {
    render(<OvertimeRequestDialog open onOpenChange={() => {}} onSubmit={vi.fn()} />)
    expect(screen.getByText('Đăng ký làm thêm giờ')).toBeInTheDocument()
  })

  it('không gọi onSubmit khi ngày trống (validation chặn)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<OvertimeRequestDialog open onOpenChange={() => {}} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Gửi đơn' }))

    await waitFor(() => {
      expect(screen.getByText('Vui lòng chọn ngày')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
