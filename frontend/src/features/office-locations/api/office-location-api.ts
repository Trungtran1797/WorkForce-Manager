import { apiClient } from '@/lib/api-client'
import type { OfficeLocation, OfficeLocationFormValues } from '@/features/office-locations/types'

interface BackendOfficeLocationDto {
  id: number
  name: string
  allowedIpRanges: string | null
  latitude: number | null
  longitude: number | null
  radiusMeters: number
  isActive: boolean
}

const BASE = '/office-locations'

function mapLocation(dto: BackendOfficeLocationDto): OfficeLocation {
  return {
    id: dto.id,
    name: dto.name,
    allowedIpRanges: dto.allowedIpRanges,
    latitude: dto.latitude,
    longitude: dto.longitude,
    radiusMeters: dto.radiusMeters,
    isActive: dto.isActive,
  }
}

export async function getOfficeLocations(): Promise<OfficeLocation[]> {
  const data = await apiClient.get<BackendOfficeLocationDto[]>(BASE)
  return data.map(mapLocation)
}

export async function saveOfficeLocation(
  id: number,
  values: OfficeLocationFormValues,
): Promise<OfficeLocation> {
  const dto = await apiClient.post<BackendOfficeLocationDto>(BASE, {
    id,
    name: values.name,
    allowedIpRanges: values.allowedIpRanges.trim() === '' ? null : values.allowedIpRanges.trim(),
    latitude: values.latitude.trim() === '' ? null : Number(values.latitude),
    longitude: values.longitude.trim() === '' ? null : Number(values.longitude),
    radiusMeters: Number(values.radiusMeters),
    isActive: values.isActive,
  })
  return mapLocation(dto)
}

export async function deleteOfficeLocation(id: number): Promise<void> {
  await apiClient.delete<unknown>(`${BASE}/${id}`)
}
