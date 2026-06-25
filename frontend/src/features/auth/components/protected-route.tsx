import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/context/auth-context'
import type { UserRole } from '@/features/auth/types'
import type { PermissionLevel } from '@/features/permissions/types'

const PERMISSION_LEVEL_ORDER: Record<PermissionLevel, number> = {
  None: 0,
  View: 1,
  Edit: 2,
}

interface ProtectedRouteProps {
  /** Nếu truyền, chỉ các role này được vào; ngược lại chỉ cần đăng nhập. */
  roles?: UserRole[]
  /** Nếu truyền, yêu cầu quyền hiệu lực của module này đạt mức `level`. */
  module?: string
  /** Mức quyền tối thiểu yêu cầu cho `module` (mặc định 'View'). */
  level?: 'View' | 'Edit'
}

export function ProtectedRoute({ roles, module, level = 'View' }: ProtectedRouteProps) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  if (module) {
    const effectiveLevel = user.permissions?.[module] ?? 'None'
    if (PERMISSION_LEVEL_ORDER[effectiveLevel] < PERMISSION_LEVEL_ORDER[level]) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
