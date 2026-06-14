import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { KeyResultRow } from './key-result-row'
import type { KeyResult } from '@/features/okrs/types'

const sampleKeyResult: KeyResult = {
  id: 1,
  title: 'Tăng doanh số 20%',
  targetValue: 100,
  currentValue: 40,
  unit: '%',
  weight: 1,
  progress: 40,
}

describe('KeyResultRow', () => {
  it('hiển thị tên, % tiến độ và giá trị mục tiêu', () => {
    render(<KeyResultRow keyResult={sampleKeyResult} onUpdateProgress={vi.fn()} />)

    expect(screen.getByText('Tăng doanh số 20%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
    expect(screen.getByText('/ 100 %')).toBeInTheDocument()
  })

  it('chỉ hiện nút Cập nhật khi giá trị thay đổi và gọi onUpdateProgress khi bấm', async () => {
    const onUpdateProgress = vi.fn().mockResolvedValue(undefined)
    render(<KeyResultRow keyResult={sampleKeyResult} onUpdateProgress={onUpdateProgress} />)

    expect(screen.queryByRole('button', { name: /Cập nhật/ })).not.toBeInTheDocument()

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '60' } })

    const button = screen.getByRole('button', { name: /Cập nhật/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(onUpdateProgress).toHaveBeenCalledWith(1, 60)
    })
  })
})
