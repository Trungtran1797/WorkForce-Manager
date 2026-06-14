import { apiClient } from '@/lib/api-client'
import type { OkrStatus } from '@/components/common/status-badge'
import type { KeyResult, ObjectiveFormValues, OkrFilters, OkrObjective, OkrOwnerType } from '@/features/okrs/types'

interface BackendKeyResultDto {
  id: number
  title: string
  targetValue: number
  currentValue: number
  unit: string | null
  weight: number
  progress: number
}

interface BackendOkrObjectiveDto {
  id: number
  title: string
  description: string | null
  ownerType: string
  departmentId: number | null
  departmentName: string | null
  employeeId: number | null
  employeeName: string | null
  period: string
  status: string
  progress: number
  keyResults: BackendKeyResultDto[]
}

const BASE = '/okrs'

function mapKeyResult(dto: BackendKeyResultDto): KeyResult {
  return { ...dto }
}

function mapObjective(dto: BackendOkrObjectiveDto): OkrObjective {
  return {
    ...dto,
    ownerType: dto.ownerType as OkrOwnerType,
    status: dto.status as OkrStatus,
    keyResults: dto.keyResults.map(mapKeyResult),
  }
}

export async function getOkrs(filters: OkrFilters): Promise<OkrObjective[]> {
  const params = new URLSearchParams()
  if (filters.period) params.set('period', filters.period)
  if (filters.departmentId) params.set('departmentId', String(filters.departmentId))
  if (filters.employeeId) params.set('employeeId', String(filters.employeeId))
  if (filters.ownerType) params.set('ownerType', filters.ownerType)
  const query = params.toString()
  const data = await apiClient.get<BackendOkrObjectiveDto[]>(`${BASE}${query ? `?${query}` : ''}`)
  return data.map(mapObjective)
}

export async function saveObjective(id: number, values: ObjectiveFormValues): Promise<OkrObjective> {
  const dto = await apiClient.post<BackendOkrObjectiveDto>(BASE, {
    id,
    title: values.title,
    description: values.description === '' ? null : values.description,
    ownerType: values.ownerType,
    departmentId: values.ownerType === 'Department' ? Number(values.departmentId) : null,
    employeeId: values.ownerType === 'Individual' ? Number(values.employeeId) : null,
    period: values.period,
    status: values.status,
    keyResults: values.keyResults.map((kr) => ({
      id: kr.id,
      title: kr.title,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
      unit: kr.unit === '' ? null : kr.unit,
      weight: Number(kr.weight),
    })),
  })
  return mapObjective(dto)
}

export async function updateKeyResultProgress(keyResultId: number, currentValue: number): Promise<OkrObjective> {
  const dto = await apiClient.patch<BackendOkrObjectiveDto>(`${BASE}/key-results/${keyResultId}`, { currentValue })
  return mapObjective(dto)
}

export async function deleteObjective(id: number): Promise<void> {
  await apiClient.delete<unknown>(`${BASE}/${id}`)
}
