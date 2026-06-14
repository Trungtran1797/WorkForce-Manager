import type { ContractStatus } from '@/components/common/status-badge'

export type ContractType = 'Probation' | 'Official' | 'Appendix'

export interface Contract {
  id: number
  employeeId: number
  employeeName: string
  contractCode: string
  contractType: ContractType
  startDate: string
  endDate: string | null
  baseSalary: number
  allowance: number
  insuranceSalary: number
  status: ContractStatus
  fileUrl: string | null
  parentContractId: number | null
}

export interface ContractFormValues {
  employeeId: string
  contractCode: string
  contractType: ContractType
  startDate: string
  endDate: string
  baseSalary: number
  allowance: number
  insuranceSalary: number
  status: ContractStatus
}
