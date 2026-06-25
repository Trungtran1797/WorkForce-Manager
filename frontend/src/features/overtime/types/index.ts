import type { OvertimeStatus } from '@/components/common/status-badge'

export interface OvertimeRequest {
  id: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  reason: string
  status: OvertimeStatus
  rejectReason: string | null
  projectId: number | null
  projectName: string | null
  taskId: number | null
  taskTitle: string | null
}

export interface OvertimeFormValues {
  date: string
  startTime: string
  endTime: string
  reason: string
  projectId: string
  taskId: string
}
