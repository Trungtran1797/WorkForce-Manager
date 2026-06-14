import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import { ReviewResultChart } from './review-result-chart'
import type { ReviewCriterion } from '@/features/performance/types'

const sampleCriteria: ReviewCriterion[] = [
  { id: 1, criterion: 'Chất lượng công việc', score: 4, weight: 1, note: null },
  { id: 2, criterion: 'Tiến độ & hiệu suất', score: 3, weight: 1, note: null },
]

describe('ReviewResultChart', () => {
  it('render không lỗi với dữ liệu tiêu chí đánh giá', () => {
    const { container } = render(<ReviewResultChart criteria={sampleCriteria} />)

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('render không lỗi khi danh sách tiêu chí trống', () => {
    const { container } = render(<ReviewResultChart criteria={[]} />)

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })
})
