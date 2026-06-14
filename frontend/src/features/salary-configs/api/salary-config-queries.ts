import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSalaryConfigs, saveSalaryConfig } from '@/features/salary-configs/api/salary-config-api'
import type { SalaryConfigFormValues } from '@/features/salary-configs/types'

const KEY = ['salary-configs'] as const

export function useSalaryConfigs() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getSalaryConfigs(),
  })
}

export function useSaveSalaryConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SalaryConfigFormValues) => saveSalaryConfig(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
