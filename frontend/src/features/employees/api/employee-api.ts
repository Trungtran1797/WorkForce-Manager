import { apiClient } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/common'
import type {
  Employee,
  EmployeeFormValues,
  EmployeeListParams,
} from '@/features/employees/types'

const BASE = '/employees'

function toPayload(values: EmployeeFormValues) {
  return {
    employeeCode: values.employeeCode,
    fullName: values.fullName,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    idCardNumber: values.idCardNumber,
    phoneNumber: values.phoneNumber,
    email: values.email,
    address: values.address,
    departmentId: Number(values.departmentId),
    position: values.position,
    hireDate: values.hireDate,
    status: values.status,
  }
}

export function getEmployees(params: EmployeeListParams): Promise<PaginatedResult<Employee>> {
  const search = new URLSearchParams()
  search.set('pageNumber', String(params.pageNumber))
  search.set('pageSize', String(params.pageSize))
  if (params.search) search.set('search', params.search)
  if (params.departmentId) search.set('departmentId', String(params.departmentId))
  if (params.status) search.set('status', params.status)
  if (params.sortBy) search.set('sortBy', params.sortBy)
  if (params.sortDirection) search.set('sortDirection', params.sortDirection)
  return apiClient.get<PaginatedResult<Employee>>(`${BASE}?${search.toString()}`)
}

export function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  return apiClient.post<Employee>(BASE, toPayload(values))
}

export function updateEmployee(id: number, values: EmployeeFormValues): Promise<Employee> {
  return apiClient.put<Employee>(`${BASE}/${id}`, { id, ...toPayload(values) })
}

export function deleteEmployee(id: number): Promise<unknown> {
  return apiClient.delete(`${BASE}/${id}`)
}
