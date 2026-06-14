import { apiClient } from '@/lib/api-client'
import type { Department, DepartmentFormValues } from '@/features/departments/types'

const BASE = '/departments'

function toPayload(values: DepartmentFormValues) {
  return {
    name: values.name,
    description: values.description,
    icon: values.icon,
    colorVariant: values.colorVariant,
    managerId: values.managerId ? Number(values.managerId) : null,
    parentDepartmentId: values.parentDepartmentId ?? null,
  }
}

export function getDepartments(search?: string): Promise<Department[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiClient.get<Department[]>(`${BASE}${query}`)
}

export function createDepartment(values: DepartmentFormValues): Promise<Department> {
  return apiClient.post<Department>(BASE, toPayload(values))
}

export function updateDepartment(id: number, values: DepartmentFormValues): Promise<Department> {
  return apiClient.put<Department>(`${BASE}/${id}`, { id, ...toPayload(values) })
}

export function deleteDepartment(id: number): Promise<unknown> {
  return apiClient.delete(`${BASE}/${id}`)
}
