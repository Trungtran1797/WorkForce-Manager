import { apiClient } from '@/lib/api-client'
import type {
  AssignShiftValues,
  Shift,
  ShiftAssignment,
  ShiftFormValues,
  ShiftType,
} from '@/features/shifts/types'

interface BackendShiftDto {
  id: number
  code: string
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  shiftType: string
  isActive: boolean
}

interface BackendShiftAssignmentDto {
  id: number
  employeeId: number
  employeeName: string
  shiftId: number
  shiftName: string
  workDate: string
  note: string | null
}

const BASE = '/shifts'

function mapShift(dto: BackendShiftDto): Shift {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    startTime: dto.startTime,
    endTime: dto.endTime,
    breakMinutes: dto.breakMinutes,
    shiftType: dto.shiftType as ShiftType,
    isActive: dto.isActive,
  }
}

function mapAssignment(dto: BackendShiftAssignmentDto): ShiftAssignment {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    shiftId: dto.shiftId,
    shiftName: dto.shiftName,
    workDate: dto.workDate,
    note: dto.note,
  }
}

function toPayload(values: ShiftFormValues) {
  return {
    code: values.code,
    name: values.name,
    startTime: values.startTime,
    endTime: values.endTime,
    breakMinutes: Number(values.breakMinutes),
    shiftType: values.shiftType,
    isActive: values.isActive,
  }
}

export async function getShifts(): Promise<Shift[]> {
  const data = await apiClient.get<BackendShiftDto[]>(BASE)
  return data.map(mapShift)
}

export async function createShift(values: ShiftFormValues): Promise<Shift> {
  const dto = await apiClient.post<BackendShiftDto>(BASE, toPayload(values))
  return mapShift(dto)
}

export async function updateShift(id: number, values: ShiftFormValues): Promise<Shift> {
  const dto = await apiClient.put<BackendShiftDto>(`${BASE}/${id}`, toPayload(values))
  return mapShift(dto)
}

export async function deleteShift(id: number): Promise<void> {
  await apiClient.delete<unknown>(`${BASE}/${id}`)
}

export async function getShiftSchedule(startDate: string, endDate: string): Promise<ShiftAssignment[]> {
  const data = await apiClient.get<BackendShiftAssignmentDto[]>(
    `${BASE}/schedule?startDate=${startDate}&endDate=${endDate}`,
  )
  return data.map(mapAssignment)
}

export async function assignShift(values: AssignShiftValues): Promise<ShiftAssignment> {
  const dto = await apiClient.post<BackendShiftAssignmentDto>(`${BASE}/assign`, {
    employeeId: Number(values.employeeId),
    shiftId: Number(values.shiftId),
    workDate: values.workDate,
    note: values.note,
  })
  return mapAssignment(dto)
}
