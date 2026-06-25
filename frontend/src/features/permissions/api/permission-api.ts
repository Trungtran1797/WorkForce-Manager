import { apiClient } from '@/lib/api-client'
import type { PermissionMatrixDto, UpdatePermissionMatrixPayload } from '@/features/permissions/types'

const BASE = '/permissions/matrix'

export function getPermissionMatrix(): Promise<PermissionMatrixDto> {
  return apiClient.get<PermissionMatrixDto>(BASE)
}

export function updatePermissionMatrix(payload: UpdatePermissionMatrixPayload): Promise<unknown> {
  return apiClient.put<unknown>(BASE, payload)
}
