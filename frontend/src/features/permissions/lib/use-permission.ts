import { useAuth } from '@/features/auth/context/auth-context'
import type { PermissionLevel } from '@/features/permissions/types'

/**
 * Trả về mức quyền hiệu lực (None/View/Edit) của user hiện tại cho 1 module.
 * Dữ liệu lấy từ `user.permissions` (đã được backend tính sẵn = max(role, department override)).
 */
export function usePermission(moduleKey: string): PermissionLevel {
  const { user } = useAuth()
  return user?.permissions?.[moduleKey] ?? 'None'
}

/** True nếu user có quyền Chỉnh sửa (Edit) trên module. */
export function useCanEdit(moduleKey: string): boolean {
  return usePermission(moduleKey) === 'Edit'
}

/** True nếu user có quyền Chỉ xem hoặc Chỉnh sửa (khác None) trên module. */
export function useCanView(moduleKey: string): boolean {
  return usePermission(moduleKey) !== 'None'
}
