import type { OkrStatus } from '@/components/common/status-badge'

export type OkrOwnerType = 'Department' | 'Individual'

export interface KeyResult {
  id: number
  title: string
  targetValue: number
  currentValue: number
  unit: string | null
  weight: number
  progress: number
}

export interface OkrObjective {
  id: number
  title: string
  description: string | null
  ownerType: OkrOwnerType
  departmentId: number | null
  departmentName: string | null
  employeeId: number | null
  employeeName: string | null
  period: string
  status: OkrStatus
  progress: number
  keyResults: KeyResult[]
}

export interface KeyResultFormValue {
  id: number
  title: string
  targetValue: number
  currentValue: number
  unit: string
  weight: number
}

export interface ObjectiveFormValues {
  title: string
  description: string
  ownerType: OkrOwnerType
  departmentId: string
  employeeId: string
  period: string
  status: OkrStatus
  keyResults: KeyResultFormValue[]
}

export interface OkrFilters {
  period?: string
  departmentId?: number
  employeeId?: number
  ownerType?: OkrOwnerType
}
