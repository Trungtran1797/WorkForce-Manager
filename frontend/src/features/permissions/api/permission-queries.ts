import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getPermissionMatrix, updatePermissionMatrix } from '@/features/permissions/api/permission-api'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'
import type { UpdatePermissionMatrixPayload } from '@/features/permissions/types'

const PERMISSION_MATRIX_KEY = ['permission-matrix'] as const

export function useGetPermissionMatrix() {
  return useQuery({
    queryKey: PERMISSION_MATRIX_KEY,
    queryFn: () => getPermissionMatrix(),
  })
}

export function useUpdatePermissionMatrix() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePermissionMatrixPayload) => updatePermissionMatrix(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PERMISSION_MATRIX_KEY })
      toast({
        title: 'Đã lưu phân quyền',
        description: 'Ma trận phân quyền đã được cập nhật thành công.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Lưu phân quyền thất bại',
        description: error instanceof ApiError ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      })
    },
  })
}
