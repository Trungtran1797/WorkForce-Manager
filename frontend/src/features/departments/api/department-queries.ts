import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '@/features/departments/api/department-api'
import type { DepartmentFormValues } from '@/features/departments/types'

const DEPARTMENTS_KEY = ['departments'] as const

export function useDepartments(search?: string) {
  return useQuery({
    queryKey: [...DEPARTMENTS_KEY, search ?? ''],
    queryFn: () => getDepartments(search),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DepartmentFormValues) => createDepartment(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: DepartmentFormValues }) =>
      updateDepartment(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}
