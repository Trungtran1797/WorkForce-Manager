import { apiClient } from '@/lib/api-client'

const BASE = '/system-settings'

export interface SystemSettingDto {
  key: string
  value: string
  description: string | null
  updatedDate: string
  updatedBy: string | null
}

export function getSystemSettings(): Promise<SystemSettingDto[]> {
  return apiClient.get<SystemSettingDto[]>(BASE)
}

export function updateSystemSetting(key: string, value: string): Promise<unknown> {
  return apiClient.put<unknown>(`${BASE}/${key}`, { value })
}
