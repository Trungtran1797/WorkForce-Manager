import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Employee } from '@/features/employees/types'
import type { ProjectMember } from '@/features/projects/types'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  existingMembers: ProjectMember[]
  isSubmitting: boolean
  onAdd: (selections: { employeeId: number; role: string }[]) => Promise<void>
}

export function AddMemberDialog({
  open,
  onOpenChange,
  employees,
  existingMembers,
  isSubmitting,
  onAdd,
}: AddMemberDialogProps) {
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [role, setRole] = useState('')

  const departments = useMemo(() => {
    const map = new Map<number, string>()
    employees.forEach((e) => map.set(e.departmentId, e.departmentName))
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'vi'))
  }, [employees])

  const existingIds = useMemo(
    () => new Set(existingMembers.map((m) => m.employeeId)),
    [existingMembers],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((e) => {
      if (existingIds.has(e.id)) return false
      if (departmentFilter !== 'all' && String(e.departmentId) !== departmentFilter) return false
      if (q && !e.fullName.toLowerCase().includes(q)) return false
      return true
    })
  }, [employees, existingIds, departmentFilter, search])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id))

  function toggleEmployee(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((e) => next.delete(e.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((e) => next.add(e.id))
        return next
      })
    }
  }

  function handleClose() {
    setSearch('')
    setDepartmentFilter('all')
    setSelectedIds(new Set())
    setRole('')
    onOpenChange(false)
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) return
    const selections = Array.from(selectedIds).map((employeeId) => ({
      employeeId,
      role: role.trim() || 'Thành viên',
    }))
    await onAdd(selections)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Gán nhân sự vào dự án
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-2 px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select-all bar */}
        <div className="flex items-center justify-between border-y bg-muted/40 px-6 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allFilteredSelected}
              onCheckedChange={toggleAll}
              disabled={filtered.length === 0}
            />
            <Label htmlFor="select-all" className="cursor-pointer text-xs text-muted-foreground">
              Chọn tất cả ({filtered.length})
            </Label>
          </div>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              Đã chọn {selectedIds.size} người
            </Badge>
          )}
        </div>

        {/* Employee list */}
        <div className="max-h-64 min-h-0 overflow-y-auto px-6 py-2">
          {filtered.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Không tìm thấy nhân viên phù hợp
            </div>
          ) : (
            <ul className="space-y-1 py-1">
              {filtered.map((emp) => {
                const checked = selectedIds.has(emp.id)
                return (
                  <li key={emp.id}>
                    <label
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{emp.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {emp.position || '—'}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {emp.departmentName}
                        </Badge>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Role input */}
        <div className="border-t px-6 py-3">
          <Input
            placeholder="Vai trò trong dự án (vd: Developer, PM...)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Để trống sẽ dùng "Thành viên" — áp dụng cho tất cả người được chọn.
          </p>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting
              ? 'Đang gán...'
              : `Gán ${selectedIds.size > 0 ? selectedIds.size + ' ' : ''}nhân sự`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
