import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { TaskFormDialog } from './task-form-dialog'
import type { Task } from '@/features/tasks/types'

vi.mock('@/features/employees/api/employee-queries', () => ({
  useEmployees: () => ({
    data: { items: [{ id: 1, fullName: 'Nguyễn Văn A' }], pageNumber: 1, pageSize: 100, totalCount: 1, totalPages: 1 },
  }),
}))

vi.mock('@/features/projects/api/project-queries', () => ({
  useProjects: () => ({ data: [{ id: 1, code: 'DA001', name: 'Dự án mẫu' }] }),
}))

vi.mock('@/features/tasks/api/task-queries', () => ({
  useTasks: () => ({ data: [] }),
}))

const sampleTask: Task = {
  id: 1,
  code: 'CV001',
  title: 'Thiết kế giao diện',
  description: 'Thiết kế UI dashboard',
  assigneeId: 1,
  assigneeName: 'Nguyễn Văn A',
  assignerId: 2,
  assignerName: 'Trần Thị B',
  priority: 'High',
  status: 'InProgress',
  startDate: '2026-06-01',
  dueDate: '2026-06-30',
  progress: 50,
  projectId: 1,
  projectCode: 'DA001',
  parentTaskId: null,
  parentTaskTitle: null,
  subTaskCount: 0,
  assignees: [{ employeeId: 1, fullName: 'Nguyễn Văn A' }],
}

describe('TaskFormDialog', () => {
  it('hiển thị tiêu đề "Thêm công việc mới" khi tạo mới', () => {
    render(<TaskFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Thêm công việc mới')).toBeInTheDocument()
  })

  it('hiển thị tiêu đề "Cập nhật công việc" và điền sẵn dữ liệu khi sửa', () => {
    render(<TaskFormDialog open onOpenChange={vi.fn()} task={sampleTask} onSubmit={vi.fn()} />)
    expect(screen.getByText('Cập nhật công việc')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Thiết kế giao diện')).toBeInTheDocument()
  })

  it('không gọi onSubmit khi tên công việc trống (validation chặn)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Thêm công việc' }))

    await waitFor(() => {
      expect(screen.getByText('Nhập tên công việc')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
