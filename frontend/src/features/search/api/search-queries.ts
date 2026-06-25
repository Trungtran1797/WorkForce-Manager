import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { globalSearch } from '@/features/search/api/search-api'

const SEARCH_KEY = ['global-search'] as const

export function useGlobalSearch(keyword: string) {
  const term = keyword.trim()
  return useQuery({
    queryKey: [...SEARCH_KEY, term],
    queryFn: () => globalSearch(term),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
  })
}
