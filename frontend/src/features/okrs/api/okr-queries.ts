import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteObjective, getOkrs, saveObjective, updateKeyResultProgress } from '@/features/okrs/api/okr-api'
import type { ObjectiveFormValues, OkrFilters } from '@/features/okrs/types'

const OKRS_KEY = ['okrs'] as const

export function useOkrs(filters: OkrFilters) {
  return useQuery({
    queryKey: [...OKRS_KEY, filters],
    queryFn: () => getOkrs(filters),
  })
}

export function useSaveObjective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: ObjectiveFormValues }) => saveObjective(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OKRS_KEY }),
  })
}

export function useUpdateKeyResultProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ keyResultId, currentValue }: { keyResultId: number; currentValue: number }) =>
      updateKeyResultProgress(keyResultId, currentValue),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OKRS_KEY }),
  })
}

export function useDeleteObjective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteObjective(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OKRS_KEY }),
  })
}
