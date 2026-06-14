import { apiClient } from '@/lib/api-client'
import type { ContractStatus } from '@/components/common/status-badge'
import type { Contract, ContractFormValues, ContractType } from '@/features/contracts/types'

interface BackendContractDto {
  id: number
  employeeId: number
  employeeName: string
  contractCode: string
  contractType: string
  startDate: string
  endDate: string | null
  baseSalary: number
  allowance: number
  insuranceSalary: number
  status: string
  fileUrl: string | null
  parentContractId: number | null
}

interface BackendPaginated<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const BASE = '/contracts'

function mapContract(dto: BackendContractDto): Contract {
  return {
    ...dto,
    contractType: dto.contractType as ContractType,
    status: dto.status as ContractStatus,
  }
}

export async function getContracts(search?: string): Promise<Contract[]> {
  const params = new URLSearchParams({ pageNumber: '1', pageSize: '200' })
  if (search) params.set('search', search)
  const data = await apiClient.get<BackendPaginated<BackendContractDto>>(`${BASE}?${params.toString()}`)
  return data.items.map(mapContract)
}

export async function saveContract(id: number, values: ContractFormValues): Promise<Contract> {
  const dto = await apiClient.post<BackendContractDto>(BASE, {
    id,
    employeeId: Number(values.employeeId),
    contractCode: values.contractCode,
    contractType: values.contractType,
    startDate: values.startDate,
    endDate: values.endDate === '' ? null : values.endDate,
    baseSalary: Number(values.baseSalary),
    allowance: Number(values.allowance),
    insuranceSalary: Number(values.insuranceSalary),
    status: values.status,
    fileUrl: null,
    parentContractId: null,
  })
  return mapContract(dto)
}

export async function deleteContract(id: number): Promise<void> {
  await apiClient.delete<unknown>(`${BASE}/${id}`)
}
