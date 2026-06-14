import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { checkIn, checkOut, fetchMyAttendance } from '@/features/attendance/api/attendance-api'
import type { CheckInPayload } from '@/features/attendance/types'

const ATTENDANCE_KEY = ['attendance'] as const

export function useMyAttendance() {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, 'my'],
    queryFn: () => fetchMyAttendance(),
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload?: CheckInPayload) => checkIn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ATTENDANCE_KEY, 'my'] })
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note?: string) => checkOut(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ATTENDANCE_KEY, 'my'] })
    },
  })
}
