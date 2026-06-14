export interface OfficeLocation {
  id: number
  name: string
  allowedIpRanges: string | null
  latitude: number | null
  longitude: number | null
  radiusMeters: number
  isActive: boolean
}

export interface OfficeLocationFormValues {
  name: string
  allowedIpRanges: string
  latitude: string
  longitude: string
  radiusMeters: number
  isActive: boolean
}
