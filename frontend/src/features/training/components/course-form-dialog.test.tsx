import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CourseFormDialog } from './course-form-dialog'
import type { TrainingCourse } from '@/features/training/types'

const sampleCourse: TrainingCourse = {
  id: 1,
  name: 'ASP.NET Core nâng cao',
  description: 'Khóa học chuyên sâu',
  instructor: 'Mr. A',
  startDate: '2026-07-01',
  endDate: '2026-07-15',
  enrollments: [],
}

describe('CourseFormDialog', () => {
  it('hiển thị tiêu đề "Thêm khóa đào tạo" khi tạo mới', () => {
    render(<CourseFormDialog open onOpenChange={() => {}} onSubmit={vi.fn()} />)
    expect(screen.getByText('Thêm khóa đào tạo')).toBeInTheDocument()
  })

  it('hiển thị tiêu đề "Cập nhật khóa đào tạo" và điền sẵn dữ liệu khi sửa', () => {
    render(<CourseFormDialog open course={sampleCourse} onOpenChange={() => {}} onSubmit={vi.fn()} />)

    expect(screen.getByText('Cập nhật khóa đào tạo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ASP.NET Core nâng cao')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Mr. A')).toBeInTheDocument()
  })

  it('không gọi onSubmit khi tên khóa học trống (validation chặn)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CourseFormDialog open onOpenChange={() => {}} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên khóa học')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
