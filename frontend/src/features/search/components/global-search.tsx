import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, FolderKanban, ListChecks, Loader2, Search, Users } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useGlobalSearch } from '@/features/search/api/search-queries'
import type { SearchResultItem } from '@/features/search/types'

const GROUPS: Array<{
  key: 'employees' | 'departments' | 'projects' | 'tasks'
  label: string
  icon: typeof Users
}> = [
  { key: 'employees', label: 'Nhân viên', icon: Users },
  { key: 'departments', label: 'Phòng ban', icon: Building2 },
  { key: 'projects', label: 'Dự án', icon: FolderKanban },
  { key: 'tasks', label: 'Công việc', icon: ListChecks },
]

export function GlobalSearch() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const [inputValue, setInputValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)

  // Debounce ô tìm kiếm.
  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(inputValue), 350)
    return () => window.clearTimeout(timer)
  }, [inputValue])

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const term = keyword.trim()
  const { data, isLoading, isFetching } = useGlobalSearch(term)
  const showDropdown = open && term.length >= 2

  const hasResults =
    !!data &&
    (data.employees.length > 0 ||
      data.departments.length > 0 ||
      data.projects.length > 0 ||
      data.tasks.length > 0)

  const handleSelect = (group: (typeof GROUPS)[number]['key'], item: SearchResultItem): void => {
    setOpen(false)
    setInputValue('')
    setKeyword('')

    switch (group) {
      case 'employees':
        navigate(`/employees?search=${encodeURIComponent(item.code ?? item.title)}`)
        break
      case 'departments':
        navigate(`/departments?search=${encodeURIComponent(item.title)}`)
        break
      case 'projects':
        navigate(`/projects/${item.id}`)
        break
      case 'tasks':
        navigate(`/tasks?search=${encodeURIComponent(item.code ?? item.title)}`)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Tìm kiếm..."
        className="pl-9"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setOpen(true)}
      />

      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-border bg-popover shadow-md">
          {(isLoading || isFetching) && !data ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : !hasResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả cho &quot;{term}&quot;.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1">
              {GROUPS.map((group) => {
                const items = data?.[group.key] ?? []
                if (items.length === 0) return null
                const Icon = group.icon

                return (
                  <div key={group.key} className="px-1 py-1">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                      {group.label}
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
                        onClick={() => handleSelect(group.key, item)}
                      >
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium leading-snug text-foreground">
                            {item.title}
                            {item.code && (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                {item.code}
                              </span>
                            )}
                          </p>
                          {item.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
