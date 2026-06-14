export type PayslipStatus = 'Draft' | 'Approved' | 'Paid'

export interface PayslipItem {
  label: string
  amount: number
  isEarning: boolean
}

export interface Payslip {
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
  status: PayslipStatus
  generatedDate: string
  approvedDate: string | null
  items: PayslipItem[]
}

export interface GeneratePayrollValues {
  period: string
  departmentId?: number
  standardWorkingDays: number
}
