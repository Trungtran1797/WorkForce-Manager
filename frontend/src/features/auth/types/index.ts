export type UserRole = 'SuperAdmin' | 'Manager' | 'Employee'

export interface AuthUser {
  id: number
  username: string
  email: string
  role: UserRole
  employeeId: number | null
  departmentId: number | null
  fullName: string | null
  permissions: Record<string, 'None' | 'View' | 'Edit'>
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface LoginRequest {
  userNameOrEmail: string
  password: string
}
