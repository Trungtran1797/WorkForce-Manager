import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ProjectListPage } from './project-list-page'
import type { Project } from '@/features/projects/types'

const sampleProjects: Project[] = [
  {
    id: 1,
    code: 'DA001',
    name: 'Hệ thống quản lý kho',
    investor: 'SAIGON SPICES',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'InProgress',
    budget: 500000000,
    description: 'Triển khai hệ thống quản lý kho hàng',
    progress: 40,
    members: [{ id: 1, employeeId: 1, name: 'Nguyễn Văn A', role: 'Lead', avatarColor: 'primary' }],
  },
]

const mockUseProjects = vi.fn()

vi.mock('@/features/projects/api/project-queries', () => ({
  useProjects: () => mockUseProjects(),
  useCreateProject: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { role: 'SuperAdmin', permissions: { Projects: 'Edit' } } }),
}))

describe('ProjectListPage', () => {
  it('hiển thị danh sách dự án', () => {
    mockUseProjects.mockReturnValue({ data: sampleProjects, isLoading: false, isError: false, refetch: vi.fn() })

    render(
      <MemoryRouter>
        <ProjectListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('DA001 - Hệ thống quản lý kho')).toBeInTheDocument()
    expect(screen.getByText(/Chủ đầu tư: SAIGON SPICES/)).toBeInTheDocument()
  })

  it('hiển thị empty state khi chưa có dự án', () => {
    mockUseProjects.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() })

    render(
      <MemoryRouter>
        <ProjectListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Chưa có dự án nào')).toBeInTheDocument()
  })

  it('hiển thị error state khi tải dữ liệu thất bại', () => {
    mockUseProjects.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() })

    render(
      <MemoryRouter>
        <ProjectListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument()
  })
})
