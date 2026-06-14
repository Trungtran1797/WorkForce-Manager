import { apiClient } from '@/lib/api-client'
import type { LeaveFormValues, LeaveRequest } from '@/features/leave/types'
import type { LeaveStatus, LeaveType } from '@/types/common'

interface BackendLeaveRequestDto {
  id: number
  employeeId: number
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string | null
  status: string
  managerApproverId: number | null
  managerApprovedDate: string | null
  hrApproverId: number | null
  hrApprovedDate: string | null
  rejectReason: string | null
}

const BASE = '/leave-requests'

function mapLeaveRequest(dto: BackendLeaveRequestDto): LeaveRequest {
  return {
    id: String(dto.id),
    employeeName: dto.employeeName,
    leaveType: dto.leaveType as LeaveType,
    startDate: dto.startDate,
    endDate: dto.endDate,
    reason: dto.reason ?? '',
    status: dto.status as LeaveStatus,
  }
}

export async function fetchMyLeaveRequests(): Promise<LeaveRequest[]> {
  const data = await apiClient.get<BackendLeaveRequestDto[]>(`${BASE}/my`)
  return data.map(mapLeaveRequest)
}

export async function fetchPendingLeaveRequests(): Promise<LeaveRequest[]> {
  const data = await apiClient.get<BackendLeaveRequestDto[]>(`${BASE}/pending`)
  return data.map(mapLeaveRequest)
}

export async function createLeaveRequest(values: LeaveFormValues): Promise<LeaveRequest> {
  const dto = await apiClient.post<BackendLeaveRequestDto>(BASE, {
    leaveType: values.leaveType,
    startDate: values.startDate,
    endDate: values.endDate,
    reason: values.reason,
  })
  return mapLeaveRequest(dto)
}

export async function approveLeaveRequest(id: string): Promise<LeaveRequest> {
  const dto = await apiClient.post<BackendLeaveRequestDto>(`${BASE}/${id}/approve`)
  return mapLeaveRequest(dto)
}

export async function rejectLeaveRequest(id: string, reason: string): Promise<LeaveRequest> {
  const dto = await apiClient.post<BackendLeaveRequestDto>(`${BASE}/${id}/reject`, { reason })
  return mapLeaveRequest(dto)
}
