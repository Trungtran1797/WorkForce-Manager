export type PermissionLevel = 'None' | 'View' | 'Edit'

export interface PermissionModuleInfo {
  key: string
  label: string
}

/** 20 module khớp với backend `PermissionModule` enum, theo thứ tự khai báo. */
export const PERMISSION_MODULES: PermissionModuleInfo[] = [
  { key: 'Dashboard', label: 'Tổng quan' },
  { key: 'Employees', label: 'Quản lý Nhân viên' },
  { key: 'Departments', label: 'Quản lý Phòng ban' },
  { key: 'Projects', label: 'Dự án' },
  { key: 'Tasks', label: 'Công việc' },
  { key: 'Attendance', label: 'Chấm công' },
  { key: 'Leave', label: 'Nghỉ phép' },
  { key: 'Overtime', label: 'Tăng ca' },
  { key: 'Shifts', label: 'Ca làm việc' },
  { key: 'OfficeLocations', label: 'Địa điểm chấm công' },
  { key: 'Contracts', label: 'Hợp đồng' },
  { key: 'Payroll', label: 'Bảng lương' },
  { key: 'SalaryConfigs', label: 'Cấu hình lương' },
  { key: 'Payslips', label: 'Phiếu lương cá nhân' },
  { key: 'Okrs', label: 'Mục tiêu (OKRs)' },
  { key: 'Performance', label: 'Đánh giá hiệu suất' },
  { key: 'Training', label: 'Đào tạo' },
  { key: 'Reports', label: 'Báo cáo' },
  { key: 'Notifications', label: 'Thông báo' },
  { key: 'PermissionMatrix', label: 'Phân quyền' },
  { key: 'Users', label: 'Quản lý Tài khoản' },
]

export interface RolePermissionDto {
  role: string
  module: string
  level: PermissionLevel
}

export interface DepartmentOverrideDto {
  departmentId: number
  departmentName: string
  module: string
  level: PermissionLevel
}

export interface PermissionMatrixDepartment {
  id: number
  name: string
}

export interface PermissionMatrixDto {
  rolePermissions: RolePermissionDto[]
  departmentOverrides: DepartmentOverrideDto[]
  roles: string[]
  modules: string[]
  levels: string[]
  departments: PermissionMatrixDepartment[]
}

export interface UpdatePermissionMatrixPayload {
  rolePermissions: RolePermissionDto[]
  departmentOverrides: DepartmentOverrideDto[]
}
