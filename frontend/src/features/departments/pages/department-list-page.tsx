import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  Calculator,
  Code,
  MoreHorizontal,
  Megaphone,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, CardGridSkeleton } from '@/components/common/data-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DepartmentFormDialog } from '@/features/departments/components/department-form-dialog'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '@/features/departments/api/department-queries'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import type { Department, DepartmentFormValues } from '@/features/departments/types'

const ICON_MAP: Record<Department['icon'], LucideIcon> = {
  code: Code,
  briefcase: Briefcase,
  users: Users,
  calculator: Calculator,
  megaphone: Megaphone,
}

const COLOR_MAP: Record<Department['colorVariant'], string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

export function DepartmentListPage() {
  const canEdit = useCanEdit('Departments')
  const { data: departments = [], isLoading, isError, refetch } = useDepartments()
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const deleteMutation = useDeleteDepartment()

  const [searchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return departments
    return departments.filter(
      (department) =>
        department.name.toLowerCase().includes(term) ||
        department.managerName.toLowerCase().includes(term) ||
        department.description.toLowerCase().includes(term),
    )
  }, [departments, search])

  const groups = useMemo(() => {
    const topLevels = filteredDepartments.filter((dept) => dept.parentDepartmentId === null)
    const orphanChildren = filteredDepartments.filter(
      (dept) =>
        dept.parentDepartmentId !== null &&
        !departments.some((parent) => parent.id === dept.parentDepartmentId),
    )

    const result: Array<{ parent: Department | null; children: Department[] }> = topLevels.map((parent) => ({
      parent,
      children: filteredDepartments.filter((dept) => dept.parentDepartmentId === parent.id),
    }))

    if (orphanChildren.length > 0) {
      result.push({ parent: null, children: orphanChildren })
    }

    return result
  }, [filteredDepartments, departments])

  const handleOpenAddDialog = (): void => {
    setEditingDepartment(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (department: Department): void => {
    setEditingDepartment(department)
    setDialogOpen(true)
  }

  const handleDelete = (department: Department): void => {
    if (window.confirm(`Xóa phòng ban "${department.name}"?`)) {
      deleteMutation.mutate(department.id)
    }
  }

  const handleFormSubmit = async (values: DepartmentFormValues): Promise<void> => {
    if (editingDepartment) {
      await updateMutation.mutateAsync({ id: editingDepartment.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Phòng ban</h1>
          <p className="text-sm text-muted-foreground">Quản lý cơ cấu phòng ban và trưởng phòng</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleOpenAddDialog}>
            <Plus className="size-4" />
            Thêm phòng ban
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, trưởng phòng, mô tả..."
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <Card className="p-0">
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      )}

      {!isLoading && !isError && departments.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Building2}
            title="Chưa có phòng ban nào"
            description="Tạo phòng ban đầu tiên để bắt đầu cơ cấu tổ chức."
            actionLabel={canEdit ? 'Thêm phòng ban' : undefined}
            onAction={canEdit ? handleOpenAddDialog : undefined}
          />
        </Card>
      )}

      {!isLoading && !isError && departments.length > 0 && filteredDepartments.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Search}
            title="Không tìm thấy phòng ban phù hợp"
            description="Thử thay đổi từ khóa tìm kiếm."
          />
        </Card>
      )}

      {!isLoading && !isError && filteredDepartments.length > 0 && (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.parent ? group.parent.id : 'orphan'} className="space-y-3">
              {group.parent ? (
                <div className="flex items-center gap-2">
                  <Badge>Khối</Badge>
                  <h2 className="text-lg font-semibold">{group.parent.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {group.parent.employeeCount} nhân sự
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="gray">Khác</Badge>
                  <h2 className="text-lg font-semibold">Phòng ban không xác định khối</h2>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.parent && (
                  <DepartmentCard
                    department={group.parent}
                    highlighted
                    canEdit={canEdit}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleDelete}
                  />
                )}
                {group.children.map((department) => (
                  <DepartmentCard
                    key={department.id}
                    department={department}
                    canEdit={canEdit}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

interface DepartmentCardProps {
  department: Department
  highlighted?: boolean
  canEdit: boolean
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
}

function DepartmentCard({ department, highlighted, canEdit, onEdit, onDelete }: DepartmentCardProps) {
  const Icon = ICON_MAP[department.icon] ?? Building2

  return (
    <Card className={cn(highlighted && 'border-primary/40 bg-primary/5')}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-lg',
              COLOR_MAP[department.colorVariant] ?? COLOR_MAP.primary,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <div className="font-semibold">{department.name}</div>
            <div className="text-xs text-muted-foreground">
              Trưởng phòng: {department.managerName || 'Chưa phân công'}
            </div>
          </div>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Hành động">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(department)}>Sửa thông tin</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(department)}>
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{department.description}</p>
      <div className="text-sm font-medium">{department.employeeCount} nhân sự</div>
    </Card>
  )
}
