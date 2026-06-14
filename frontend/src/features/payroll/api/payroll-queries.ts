import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approvePayslip,
  fetchMyPayslips,
  fetchPayslips,
  generatePayroll,
  sendPayslipEmail,
} from '@/features/payroll/api/payroll-api'
import type { GeneratePayrollValues } from '@/features/payroll/types'

const PAYROLL_KEY = ['payroll'] as const

export function usePayslips(period: string, departmentId?: number, enabled = true) {
  return useQuery({
    queryKey: [...PAYROLL_KEY, 'list', period, departmentId ?? null],
    queryFn: () => fetchPayslips(period, departmentId),
    enabled: enabled && period !== '',
  })
}

export function useMyPayslips() {
  return useQuery({
    queryKey: [...PAYROLL_KEY, 'my'],
    queryFn: () => fetchMyPayslips(),
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: GeneratePayrollValues) => generatePayroll(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...PAYROLL_KEY, 'list'] }),
  })
}

export function useApprovePayslip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approvePayslip(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...PAYROLL_KEY, 'list'] }),
  })
}

export function useSendPayslipEmail() {
  return useMutation({
    mutationFn: (id: number) => sendPayslipEmail(id),
  })
}
