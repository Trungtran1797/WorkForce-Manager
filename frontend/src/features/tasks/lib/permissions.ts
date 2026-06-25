import type { AuthUser } from '@/features/auth/types'
import type { Task } from '@/features/tasks/types'

/**
 * Chỉ Người thực hiện hoặc Người giao việc của 1 task cụ thể mới được chỉnh sửa
 * (đổi trạng thái, % hoàn thành, sửa thông tin, xóa) công việc đó - kiểm tra ở cấp item.
 *
 * Kết hợp với quyền module `Permission:Tasks:Edit` (xem `useCanEdit('Tasks')`) ở cấp gọi:
 * `useCanEdit('Tasks') || canEditTask(task, user)`. SuperAdmin/Manager có Edit trên module
 * Tasks theo seed data nên luôn thỏa điều kiện OR này.
 */
export function canEditTask(task: Task, user: AuthUser | null): boolean {
  if (!user) return false

  return (
    (task.assigneeId !== null && task.assigneeId === user.employeeId) ||
    (task.assignerId !== null && task.assignerId === user.employeeId)
  )
}
