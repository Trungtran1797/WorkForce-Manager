import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProjectMember,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  removeProjectMember,
  updateProject,
} from '@/features/projects/api/project-api'
import type { ProjectFormValues } from '@/features/projects/types'

const PROJECTS_KEY = ['projects'] as const

export function useProjects(search?: string, status?: string) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, search ?? '', status ?? ''],
    queryFn: () => getProjects(search, status),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'detail', id],
    queryFn: () => getProject(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: ProjectFormValues) => createProject(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: ProjectFormValues }) => updateProject(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useAddProjectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId, role }: { id: number; employeeId: number; role: string }) =>
      addProjectMember(id, employeeId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useRemoveProjectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId }: { id: number; memberId: number }) => removeProjectMember(id, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}
