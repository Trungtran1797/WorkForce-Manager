export interface SearchResultItem {
  id: number
  title: string
  code: string | null
  subtitle: string | null
}

export interface GlobalSearchResult {
  employees: SearchResultItem[]
  departments: SearchResultItem[]
  projects: SearchResultItem[]
  tasks: SearchResultItem[]
}
