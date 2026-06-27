import { apiClient, tokenStore } from '@/lib/api-client'
import type { Project, ProjectFormValues, ProjectTemplate } from '@/features/projects/types'

const BASE = '/projects'

export function getProjects(search?: string, status?: string, includeTemplates?: boolean): Promise<Project[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (includeTemplates) params.set('includeTemplates', 'true')
  const qs = params.toString()
  return apiClient.get<Project[]>(qs ? `${BASE}?${qs}` : BASE)
}

export function markProjectAsTemplate(id: number, isTemplate: boolean): Promise<Project> {
  return apiClient.patch<Project>(`${BASE}/${id}/mark-template`, { isTemplate })
}

export function getProject(id: number): Promise<Project> {
  return apiClient.get<Project>(`${BASE}/${id}`)
}

export function createProject(values: ProjectFormValues): Promise<Project> {
  return apiClient.post<Project>(BASE, values)
}

export function updateProject(id: number, values: ProjectFormValues): Promise<Project> {
  return apiClient.put<Project>(`${BASE}/${id}`, { id, ...values })
}

export function deleteProject(id: number): Promise<unknown> {
  return apiClient.delete(`${BASE}/${id}`)
}

export function getProjectTemplates(): Promise<ProjectTemplate[]> {
  return apiClient.get<ProjectTemplate[]>(`${BASE}/templates`)
}

export interface CreateFromTemplateValues {
  templateId: number
  name: string
  investor?: string
  startDate: string
  budget: number
  description?: string
  code?: string
  shippingDate?: string
  endDate?: string
}

export function createProjectFromTemplate(values: CreateFromTemplateValues): Promise<Project> {
  return apiClient.post<Project>(`${BASE}/from-template`, values)
}

export function addProjectMember(id: number, employeeId: number, role: string): Promise<Project> {
  return apiClient.post<Project>(`${BASE}/${id}/members`, { employeeId, role })
}

export function removeProjectMember(id: number, memberId: number): Promise<Project> {
  return apiClient.delete<Project>(`${BASE}/${id}/members/${memberId}`)
}

export async function uploadProjectAttachments(projectId: number, files: File[]): Promise<void> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const API_BASE_URL: string =
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Tải lên tài liệu đính kèm thất bại (${response.status}).`)
  }
}
