import { apiClient, tokenStore, ApiError } from '@/lib/api-client'
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
    placeOfOrigin: values.placeOfOrigin || null,
    maritalStatus: values.maritalStatus || null,
    oneOfficeAccount: values.oneOfficeAccount || null,
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

export interface ImportEmployeesResult {
  successCount: number
  failedCount: number
  errors: string[]
}

export async function exportEmployees(templateOnly: boolean = false): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'
  const response = await fetch(`${API_BASE_URL}/employees/export?templateOnly=${templateOnly}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Xuất danh sách nhân sự thất bại (${response.status})`)
  }

  const disposition = response.headers.get('content-disposition')
  let fileName = templateOnly ? 'Mau_Import_NhanVien.csv' : 'DanhSach_NhanVien.csv'
  if (disposition) {
    const filenameRegex = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i
    const matches = filenameRegex.exec(disposition)
    if (matches && matches[1]) {
      fileName = decodeURIComponent(matches[1])
    }
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function importEmployees(file: File): Promise<ImportEmployeesResult> {
  const formData = new FormData()
  formData.append('file', file)

  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'
  const response = await fetch(`${API_BASE_URL}/employees/import`, {
    method: 'POST',
    headers,
    body: formData,
  })

  let envelope: any = null
  try {
    envelope = await response.json()
  } catch {
    envelope = null
  }

  if (!response.ok || !envelope?.success || !envelope.data) {
    throw new ApiError(
      envelope?.message ?? `Import nhân viên thất bại (${response.status}).`,
      response.status,
      envelope?.errors,
    )
  }

  return envelope.data
}

export function getMyProfile(): Promise<Employee> {
  return apiClient.get<Employee>(`${BASE}/profile`)
}

export function updateMyProfile(values: Partial<EmployeeFormValues>): Promise<Employee> {
  return apiClient.put<Employee>(`${BASE}/profile`, values)
}
