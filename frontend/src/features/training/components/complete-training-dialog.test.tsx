import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CompleteTrainingDialog } from './complete-training-dialog'
import type { TrainingEnrollment } from '@/features/training/types'

const sampleEnrollment: TrainingEnrollment = {
  id: 1,
  employeeId: 1,
  employeeName: 'Nguyễn Văn A',
  status: 'Enrolled',
  completedDate: null,
  certificateCode: null,
}

describe('CompleteTrainingDialog', () => {
  it('hiển thị tên nhân viên trong tiêu đề', () => {
    render(<CompleteTrainingDialog open enrollment={sampleEnrollment} onOpenChange={() => {}} onSubmit={vi.fn()} />)

    expect(screen.getByText('Cập nhật trạng thái đào tạo - Nguyễn Văn A')).toBeInTheDocument()
  })

  it('gọi onSubmit với id enrollment và giá trị form khi bấm Lưu', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CompleteTrainingDialog open enrollment={sampleEnrollment} onOpenChange={() => {}} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByPlaceholderText('VD: CERT-2026-001'), { target: { value: 'CERT-001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(1, expect.objectContaining({ certificateCode: 'CERT-001' }))
    })
  })

  it('không render gì khi enrollment là null', () => {
    const { container } = render(<CompleteTrainingDialog open enrollment={null} onOpenChange={() => {}} onSubmit={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
