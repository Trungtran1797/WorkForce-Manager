import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteOfficeLocation,
  getOfficeLocations,
  saveOfficeLocation,
} from '@/features/office-locations/api/office-location-api'
import type { OfficeLocationFormValues } from '@/features/office-locations/types'

const KEY = ['office-locations'] as const

export function useOfficeLocations() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getOfficeLocations(),
  })
}

export function useSaveOfficeLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: OfficeLocationFormValues }) =>
      saveOfficeLocation(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteOfficeLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteOfficeLocation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
