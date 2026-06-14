import { apiClient } from '@/lib/api-client'
import type { SalaryConfig, SalaryConfigFormValues } from '@/features/salary-configs/types'

interface BackendSalaryConfigDto {
  id: number
  employeeId: number
  employeeName: string
  baseSalary: number
  allowance: number
  insuranceSalary: number
  dependentCount: number
}

const BASE = '/salary-configs'

export async function getSalaryConfigs(): Promise<SalaryConfig[]> {
  return apiClient.get<BackendSalaryConfigDto[]>(BASE)
}

export async function saveSalaryConfig(values: SalaryConfigFormValues): Promise<SalaryConfig> {
  return apiClient.post<BackendSalaryConfigDto>(BASE, {
    employeeId: Number(values.employeeId),
    baseSalary: Number(values.baseSalary),
    allowance: Number(values.allowance),
    insuranceSalary: Number(values.insuranceSalary),
    dependentCount: Number(values.dependentCount),
  })
}
