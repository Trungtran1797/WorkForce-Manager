import { apiClient } from '@/lib/api-client'
import type { AttendanceRecord, CheckInPayload } from '@/features/attendance/types'
import type { AttendanceStatus } from '@/types/common'

interface BackendAttendanceDto {
  id: number
  employeeId: number
  employeeName: string
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  status: string
  workingHours: number | null
  note: string | null
  shiftId: number | null
  shiftName: string | null
  overtimeHours: number | null
  locationValid: boolean
}

const BASE = '/attendances'

function mapAttendance(dto: BackendAttendanceDto): AttendanceRecord {
  return {
    id: String(dto.id),
    date: dto.date,
    checkIn: dto.checkInTime ? dto.checkInTime.substring(0, 5) : null,
    checkOut: dto.checkOutTime ? dto.checkOutTime.substring(0, 5) : null,
    totalHours: dto.workingHours,
    status: dto.status as AttendanceStatus,
    shiftName: dto.shiftName,
    overtimeHours: dto.overtimeHours,
    locationValid: dto.locationValid,
  }
}

export async function fetchMyAttendance(): Promise<AttendanceRecord[]> {
  const data = await apiClient.get<BackendAttendanceDto[]>(`${BASE}/my`)
  return data.map(mapAttendance)
}

export async function checkIn(payload: CheckInPayload = {}): Promise<AttendanceRecord> {
  const dto = await apiClient.post<BackendAttendanceDto>(`${BASE}/check-in`, {
    note: payload.note,
    latitude: payload.latitude,
    longitude: payload.longitude,
  })
  return mapAttendance(dto)
}

export async function checkOut(note?: string): Promise<AttendanceRecord> {
  const dto = await apiClient.post<BackendAttendanceDto>(`${BASE}/check-out`, { note })
  return mapAttendance(dto)
}
