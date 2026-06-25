import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MoreHorizontal, Plus, Search, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeStatusBadge } from '@/components/common/status-badge'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmployeeFormDialog } from '@/features/employees/components/employee-form-dialog'
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '@/features/employees/api/employee-queries'
import { useDepartments } from '@/features/departments/api/department-queries'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import type { Employee, EmployeeFormValues } from '@/features/employees/types'

const PAGE_SIZE = 10

export function EmployeeListPage() {
  const canEdit = useCanEdit('Employees')
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Debounce ô tìm kiếm.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params = useMemo(
    () => ({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      departmentId: departmentFilter === 'all' ? undefined : Number(departmentFilter),
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [page, search, departmentFilter, statusFilter],
  )

  const { data, isLoading, isError, refetch, isFetching } = useEmployees(params)
  const { data: departments = [] } = useDepartments()
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const deleteMutation = useDeleteEmployee()

  const employees = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleOpenAddDialog = (): void => {
    setEditingEmployee(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (employee: Employee): void => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const handleDelete = (employee: Employee): void => {
    if (window.confirm(`Xóa nhân viên "${employee.fullName}"?`)) {
      deleteMutation.mutate(employee.id)
    }
  }

  const handleFormSubmit = async (values: EmployeeFormValues): Promise<void> => {
    if (editingEmployee) {
      await updateMutation.mutateAsync({ id: editingEmployee.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nhân viên</h1>
          <p className="text-sm text-muted-foreground">Quản lý thông tin nhân sự</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleOpenAddDialog}>
            <Plus className="size-4" />
            Thêm nhân viên
          </Button>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã NV, email..."
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <Select
          value={departmentFilter}
          onValueChange={(value) => {
            setDepartmentFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tất cả phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={String(department.id)}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Active">Đang làm việc</SelectItem>
            <SelectItem value="Inactive">Đã nghỉ</SelectItem>
            <SelectItem value="OnLeave">Đang nghỉ phép</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-0">
        {isLoading && <TableSkeleton rows={6} columns={7} />}

        {isError && <ErrorState onRetry={() => void refetch()} />}

        {!isLoading && !isError && employees.length === 0 && (
          <EmptyState
            icon={Users}
            title="Không tìm thấy nhân viên"
            description="Không có nhân viên nào khớp với điều kiện tìm kiếm/lọc hiện tại."
            actionLabel={canEdit ? 'Thêm nhân viên' : undefined}
            onAction={canEdit ? handleOpenAddDialog : undefined}
          />
        )}

        {!isLoading && !isError && employees.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeCode}</TableCell>
                    <TableCell>{employee.fullName}</TableCell>
                    <TableCell>{employee.departmentName}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={employee.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Hành động">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(employee)}>
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(employee)}
                            >
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground sm:flex-row">
              <span>
                {totalCount > 0
                  ? `Hiển thị ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalCount)} / ${totalCount}`
                  : ''}
                {isFetching && ' • đang tải...'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
