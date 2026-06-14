export type ShiftType = 'Administrative' | 'Shift' | 'Night'

export interface Shift {
  id: number
  code: string
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  shiftType: ShiftType
  isActive: boolean
}

export interface ShiftFormValues {
  code: string
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  shiftType: ShiftType
  isActive: boolean
}

export interface ShiftAssignment {
  id: number
  employeeId: number
  employeeName: string
  shiftId: number
  shiftName: string
  workDate: string
  note: string | null
}

export interface AssignShiftValues {
  employeeId: string
  shiftId: string
  workDate: string
  note?: string
}
