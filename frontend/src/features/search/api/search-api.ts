import { apiClient } from '@/lib/api-client'
import type { GlobalSearchResult } from '@/features/search/types'

export function globalSearch(keyword: string): Promise<GlobalSearchResult> {
  return apiClient.get<GlobalSearchResult>(`/search?keyword=${encodeURIComponent(keyword)}`)
}
