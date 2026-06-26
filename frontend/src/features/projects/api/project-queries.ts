import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProjectMember,
  createProject,
  createProjectFromTemplate,
  deleteProject,
  getProject,
  getProjectTemplates,
  getProjects,
  markProjectAsTemplate,
  removeProjectMember,
  updateProject,
} from '@/features/projects/api/project-api'
import type { CreateFromTemplateValues } from '@/features/projects/api/project-api'
import type { ProjectFormValues } from '@/features/projects/types'

const PROJECTS_KEY = ['projects'] as const

export function useProjects(search?: string, status?: string, includeTemplates?: boolean) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, search ?? '', status ?? '', includeTemplates ? 'templates' : ''],
    queryFn: () => getProjects(search, status, includeTemplates),
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

export function useProjectTemplates() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'templates'],
    queryFn: () => getProjectTemplates(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProjectFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateFromTemplateValues) => createProjectFromTemplate(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useMarkProjectAsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isTemplate }: { id: number; isTemplate: boolean }) =>
      markProjectAsTemplate(id, isTemplate),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}
