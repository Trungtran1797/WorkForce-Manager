import type { EmployeeStatus, Gender } from '@/types/common'

export interface Employee {
  id: number
  employeeCode: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  idCardNumber: string
  phoneNumber: string
  email: string
  address: string
  departmentId: number
  departmentName: string
  position: string
  hireDate: string
  status: EmployeeStatus
  placeOfOrigin?: string
  maritalStatus?: string
  oneOfficeAccount?: string
  avatarUrl?: string
  coverPhotoUrl?: string
}

/** Giá trị form: departmentId là string cho Select, được convert sang number khi gọi API. */
export interface EmployeeFormValues {
  employeeCode: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  idCardNumber: string
  phoneNumber: string
  email: string
  address: string
  departmentId: string
  position: string
  hireDate: string
  status: EmployeeStatus
  placeOfOrigin?: string
  maritalStatus?: string
  oneOfficeAccount?: string
}

export interface EmployeeListParams {
  pageNumber: number
  pageSize: number
  search?: string
  departmentId?: number
  status?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}
