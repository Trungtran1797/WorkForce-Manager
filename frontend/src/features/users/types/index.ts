export interface User {
  id: number
  username: string
  email: string
  role: 'SuperAdmin' | 'Manager' | 'Employee'
  isActive: boolean
  employeeId: number | null
  employeeFullName: string | null
  employeeCode: string | null
  departmentName: string | null
}

export interface UserListParams {
  pageNumber: number
  pageSize: number
  search?: string
  role?: string
  isActive?: boolean
  sortBy?: string
  isDescending?: boolean
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role: string
  employeeId: number | null
}
