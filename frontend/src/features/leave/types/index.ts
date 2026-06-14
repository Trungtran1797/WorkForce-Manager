import type { LeaveStatus, LeaveType } from '@/types/common'

export interface LeaveRequest {
  id: string
  employeeName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
}

export interface LeaveFormValues {
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
}
