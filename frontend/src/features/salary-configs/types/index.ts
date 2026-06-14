export interface SalaryConfig {
  id: number
  employeeId: number
  employeeName: string
  baseSalary: number
  allowance: number
  insuranceSalary: number
  dependentCount: number
}

export interface SalaryConfigFormValues {
  employeeId: string
  baseSalary: number
  allowance: number
  insuranceSalary: number
  dependentCount: number
}
