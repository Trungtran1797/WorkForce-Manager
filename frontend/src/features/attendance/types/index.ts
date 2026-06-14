import type { AttendanceStatus } from '@/types/common'

export interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  totalHours: number | null
  status: AttendanceStatus
  shiftName: string | null
  overtimeHours: number | null
  locationValid: boolean
}

export interface CheckInPayload {
  note?: string
  latitude?: number
  longitude?: number
}
