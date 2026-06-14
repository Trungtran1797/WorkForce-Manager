export type DepartmentIcon = 'code' | 'briefcase' | 'users' | 'calculator' | 'megaphone'
export type DepartmentColor = 'primary' | 'success' | 'warning' | 'destructive'

export interface Department {
  id: number
  name: string
  managerId: number | null
  managerName: string
  employeeCount: number
  description: string
  icon: DepartmentIcon
  colorVariant: DepartmentColor
  parentDepartmentId: number | null
  parentDepartmentName: string | null
}

export interface DepartmentFormValues {
  name: string
  description: string
  icon: DepartmentIcon
  colorVariant: DepartmentColor
  managerId: string
  parentDepartmentId?: number | null
}
