import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveOvertime,
  createOvertimeRequest,
  fetchMyOvertime,
  fetchOvertimeRequests,
  rejectOvertime,
} from '@/features/overtime/api/overtime-api'
import type { OvertimeFormValues } from '@/features/overtime/types'

const OVERTIME_KEY = ['overtime'] as const

export function useMyOvertime() {
  return useQuery({
    queryKey: [...OVERTIME_KEY, 'my'],
    queryFn: () => fetchMyOvertime(),
  })
}

export function usePendingOvertime() {
  return useQuery({
    queryKey: [...OVERTIME_KEY, 'pending'],
    queryFn: () => fetchOvertimeRequests(),
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [...OVERTIME_KEY, 'my'] })
    queryClient.invalidateQueries({ queryKey: [...OVERTIME_KEY, 'pending'] })
  }
}

export function useCreateOvertime() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (values: OvertimeFormValues) => createOvertimeRequest(values),
    onSuccess: invalidate,
  })
}

export function useApproveOvertime() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => approveOvertime(id),
    onSuccess: invalidate,
  })
}

export function useRejectOvertime() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, rejectReason }: { id: string; rejectReason: string }) => rejectOvertime(id, rejectReason),
    onSuccess: invalidate,
  })
}
