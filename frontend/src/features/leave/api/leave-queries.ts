import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveLeaveRequest,
  createLeaveRequest,
  fetchMyLeaveRequests,
  fetchPendingLeaveRequests,
  rejectLeaveRequest,
} from '@/features/leave/api/leave-api'
import type { LeaveFormValues } from '@/features/leave/types'

const LEAVE_KEY = ['leave'] as const

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: [...LEAVE_KEY, 'my'],
    queryFn: () => fetchMyLeaveRequests(),
  })
}

export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: [...LEAVE_KEY, 'pending'],
    queryFn: () => fetchPendingLeaveRequests(),
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: LeaveFormValues) => createLeaveRequest(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'my'] })
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'pending'] })
    },
  })
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'my'] })
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'pending'] })
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectLeaveRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'my'] })
      queryClient.invalidateQueries({ queryKey: [...LEAVE_KEY, 'pending'] })
    },
  })
}
