import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { SubmitReviewDialog } from './submit-review-dialog'
import type { PerformanceReview } from '@/features/performance/types'

const sampleReview: PerformanceReview = {
  id: 1,
  employeeId: 1,
  employeeName: 'Nguyễn Văn A',
  reviewerId: 2,
  reviewerName: 'Trần Thị B',
  period: '2026-Q2',
  reviewType: 'Self',
  status: 'Pending',
  overallScore: 0,
  overallRating: 'Average',
  comment: null,
  submittedDate: null,
  criteria: [
    { id: 1, criterion: 'Chất lượng công việc', score: 0, weight: 1, note: null },
    { id: 2, criterion: 'Tiến độ & hiệu suất', score: 0, weight: 1, note: null },
  ],
}

describe('SubmitReviewDialog', () => {
  it('hiển thị tiêu đề và danh sách tiêu chí của phiếu đánh giá', () => {
    render(<SubmitReviewDialog open review={sampleReview} onOpenChange={() => {}} onSubmit={vi.fn()} />)

    expect(screen.getByText('Đánh giá hiệu suất - Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Chất lượng công việc', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Tiến độ & hiệu suất', { exact: false })).toBeInTheDocument()
    expect(screen.getAllByText(/trọng số 1/)).toHaveLength(2)
  })

  it('gọi onSubmit với id phiếu đánh giá khi bấm Nộp đánh giá', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<SubmitReviewDialog open review={sampleReview} onOpenChange={() => {}} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nộp đánh giá' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(1, expect.objectContaining({ comment: '' }))
    })
  })

  it('không render gì khi review là null', () => {
    const { container } = render(<SubmitReviewDialog open review={null} onOpenChange={() => {}} onSubmit={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
