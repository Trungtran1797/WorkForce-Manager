import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  assignShift,
  createShift,
  deleteShift,
  getShifts,
  getShiftSchedule,
  updateShift,
} from '@/features/shifts/api/shift-api'
import type { AssignShiftValues, ShiftFormValues } from '@/features/shifts/types'

const SHIFTS_KEY = ['shifts'] as const
const SCHEDULE_KEY = ['shift-schedule'] as const

export function useShifts() {
  return useQuery({
    queryKey: SHIFTS_KEY,
    queryFn: () => getShifts(),
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ShiftFormValues) => createShift(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: ShiftFormValues }) => updateShift(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

export function useShiftSchedule(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...SCHEDULE_KEY, startDate, endDate],
    queryFn: () => getShiftSchedule(startDate, endDate),
  })
}

export function useAssignShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AssignShiftValues) => assignShift(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  })
}
