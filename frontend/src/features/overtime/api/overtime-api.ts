import { apiClient } from '@/lib/api-client'
import type { OvertimeStatus } from '@/components/common/status-badge'
import type { OvertimeFormValues, OvertimeRequest } from '@/features/overtime/types'

interface BackendOvertimeDto {
  id: number
  employeeId: number
  employeeName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  reason: string | null
  status: string
  approverId: number | null
  approvedDate: string | null
  rejectReason: string | null
  projectId: number | null
  projectName: string | null
  taskId: number | null
  taskTitle: string | null
}

interface BackendPaginated<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const BASE = '/overtime'

function mapOvertime(dto: BackendOvertimeDto): OvertimeRequest {
  return {
    id: String(dto.id),
    employeeName: dto.employeeName,
    date: dto.date,
    startTime: dto.startTime,
    endTime: dto.endTime,
    hours: dto.hours,
    reason: dto.reason ?? '',
    status: dto.status as OvertimeStatus,
    rejectReason: dto.rejectReason,
    projectId: dto.projectId ?? null,
    projectName: dto.projectName ?? null,
    taskId: dto.taskId ?? null,
    taskTitle: dto.taskTitle ?? null,
  }
}

export async function fetchMyOvertime(): Promise<OvertimeRequest[]> {
  const data = await apiClient.get<BackendOvertimeDto[]>(`${BASE}/my`)
  return data.map(mapOvertime)
}

export async function fetchOvertimeRequests(): Promise<OvertimeRequest[]> {
  const data = await apiClient.get<BackendPaginated<BackendOvertimeDto>>(
    `${BASE}?pageNumber=1&pageSize=100&status=Pending`,
  )
  return data.items.map(mapOvertime)
}

export async function createOvertimeRequest(values: OvertimeFormValues): Promise<OvertimeRequest> {
  const dto = await apiClient.post<BackendOvertimeDto>(BASE, {
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    reason: values.reason,
    projectId: values.projectId ? Number(values.projectId) : null,
    taskId: values.taskId ? Number(values.taskId) : null,
  })
  return mapOvertime(dto)
}

export async function approveOvertime(id: string): Promise<OvertimeRequest> {
  const dto = await apiClient.post<BackendOvertimeDto>(`${BASE}/${id}/approve`)
  return mapOvertime(dto)
}

export async function rejectOvertime(id: string, rejectReason: string): Promise<OvertimeRequest> {
  const dto = await apiClient.post<BackendOvertimeDto>(`${BASE}/${id}/reject`, { rejectReason })
  return mapOvertime(dto)
}
