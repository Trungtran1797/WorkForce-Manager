import { apiClient } from '@/lib/api-client'
import type { GeneratePayrollValues, Payslip, PayslipStatus } from '@/features/payroll/types'

interface BackendPayslipItemDto {
  label: string
  amount: number
  isEarning: boolean
}

interface BackendPayslipDto {
  id: number
  employeeId: number
  employeeName: string
  period: string
  workingDays: number
  standardWorkingDays: number
  overtimeHours: number
  baseSalary: number
  allowance: number
  overtimePay: number
  grossSalary: number
  insurance: number
  personalDeduction: number
  dependentDeduction: number
  taxableIncome: number
  personalIncomeTax: number
  netSalary: number
  status: string
  generatedDate: string
  approvedDate: string | null
  items: BackendPayslipItemDto[]
}

interface BackendPaginated<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const BASE = '/payroll'

function mapPayslip(dto: BackendPayslipDto): Payslip {
  return {
    ...dto,
    status: dto.status as PayslipStatus,
  }
}

export async function fetchPayslips(period: string, departmentId?: number): Promise<Payslip[]> {
  const params = new URLSearchParams({ pageNumber: '1', pageSize: '200' })
  if (period) params.set('period', period)
  if (departmentId) params.set('departmentId', String(departmentId))
  const data = await apiClient.get<BackendPaginated<BackendPayslipDto>>(`${BASE}/payslips?${params.toString()}`)
  return data.items.map(mapPayslip)
}

export async function fetchMyPayslips(): Promise<Payslip[]> {
  const data = await apiClient.get<BackendPayslipDto[]>(`${BASE}/my`)
  return data.map(mapPayslip)
}

export async function generatePayroll(values: GeneratePayrollValues): Promise<Payslip[]> {
  const data = await apiClient.post<BackendPayslipDto[]>(`${BASE}/generate`, {
    period: values.period,
    departmentId: values.departmentId,
    standardWorkingDays: values.standardWorkingDays,
  })
  return data.map(mapPayslip)
}

export async function approvePayslip(id: number): Promise<Payslip> {
  const dto = await apiClient.post<BackendPayslipDto>(`${BASE}/payslips/${id}/approve`)
  return mapPayslip(dto)
}

export async function sendPayslipEmail(id: number): Promise<void> {
  await apiClient.post<unknown>(`${BASE}/payslips/${id}/send-email`)
}
