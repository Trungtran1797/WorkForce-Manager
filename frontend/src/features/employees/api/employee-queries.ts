import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createEmployee,
  deleteEmployee,
  exportEmployees,
  getEmployees,
  getMyProfile,
  importEmployees,
  updateEmployee,
  updateMyProfile,
} from '@/features/employees/api/employee-api'
import type { EmployeeFormValues, EmployeeListParams } from '@/features/employees/types'
import { ApiError, tokenStore } from '@/lib/api-client'

const EMPLOYEES_KEY = ['employees'] as const
const MY_PROFILE_KEY = ['employees', 'profile'] as const

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, params],
    queryFn: () => getEmployees(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: EmployeeFormValues }) =>
      updateEmployee(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useImportEmployees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importEmployees(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useExportEmployees() {
  return useMutation({
    mutationFn: (templateOnly: boolean) => exportEmployees(templateOnly),
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: () => getMyProfile(),
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<EmployeeFormValues>) => updateMyProfile(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY })
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}
