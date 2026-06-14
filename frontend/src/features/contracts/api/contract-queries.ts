import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteContract, getContracts, saveContract } from '@/features/contracts/api/contract-api'
import type { ContractFormValues } from '@/features/contracts/types'

const CONTRACTS_KEY = ['contracts'] as const

export function useContracts(search?: string) {
  return useQuery({
    queryKey: [...CONTRACTS_KEY, search ?? ''],
    queryFn: () => getContracts(search),
  })
}

export function useSaveContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: ContractFormValues }) => saveContract(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTRACTS_KEY }),
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteContract(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTRACTS_KEY }),
  })
}
