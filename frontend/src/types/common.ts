export type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Done' | 'Cancelled'

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export type ProjectStatus = 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Overdue'

export type EmployeeStatus = 'Active' | 'Inactive' | 'OnLeave'

export type Gender = 'Male' | 'Female' | 'Other'

export type LeaveType = 'Annual' | 'Sick' | 'Unpaid'

export type LeaveStatus =
  | 'PendingManager'
  | 'PendingHr'
  | 'Approved'
  | 'Rejected'
  | 'Completed'

export type AttendanceStatus = 'Full' | 'Late' | 'EarlyLeave' | 'Absent'

export interface PaginatedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface SelectOption {
  label: string
  value: string
}
