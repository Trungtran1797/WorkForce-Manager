import { useEffect, useMemo, useState } from 'react'
import { KeyRound, MoreHorizontal, Plus, Search, Shield, UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUsers,
} from '@/features/users/api/user-queries'
import { UserFormDialog } from '../components/user-form-dialog'
import { ResetPasswordDialog } from '../components/reset-password-dialog'
import type { User } from '@/features/users/types'

const PAGE_SIZE = 10

const ROLE_LABEL: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  Manager: 'Quản lý',
  Employee: 'Nhân viên',
}

export function UserListPage() {
  const canEdit = useCanEdit('Users')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Debounce search.
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
      role: roleFilter === 'all' ? undefined : roleFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [page, search, roleFilter, statusFilter]
  )

  const { data, isLoading, isError, refetch } = useUsers(params)
  const createMutation = useCreateUser()
  const updateStatusMutation = useUpdateUserStatus()
  const updateRoleMutation = useUpdateUserRole()
  const resetPasswordMutation = useResetUserPassword()

  const users = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleCreateUser = async (payload: any): Promise<void> => {
    await createMutation.mutateAsync(payload)
    refetch()
  }

  const handleToggleStatus = (user: User): void => {
    const actionText = user.isActive ? 'Khóa' : 'Mở khóa'
    setTimeout(() => {
      if (window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${user.username}"?`)) {
        updateStatusMutation.mutate(
          { id: user.id, isActive: !user.isActive },
          {
            onSuccess: () => refetch(),
          }
        )
      }
    }, 150)
  }

  const handleChangeRole = (user: User, newRole: string): void => {
    setTimeout(() => {
      if (window.confirm(`Thay đổi vai trò tài khoản "${user.username}" thành "${ROLE_LABEL[newRole]}"?`)) {
        updateRoleMutation.mutate(
          { id: user.id, role: newRole },
          {
            onSuccess: () => refetch(),
          }
        )
      }
    }, 150)
  }

  const handleOpenResetPassword = (user: User): void => {
    setSelectedUser(user)
    setTimeout(() => {
      setResetPasswordOpen(true)
    }, 150)
  }

  const handleResetPassword = async (password: string): Promise<void> => {
    if (!selectedUser) return
    await resetPasswordMutation.mutateAsync({ id: selectedUser.id, password })
    alert(`Đặt lại mật khẩu cho tài khoản "${selectedUser.username}" thành công.`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tài khoản</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản đăng nhập hệ thống</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateUserOpen(true)}>
            <Plus className="size-4" />
            Tạo tài khoản
          </Button>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên đăng nhập, email, họ tên..."
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tất cả vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="SuperAdmin">Super Admin</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
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
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <EmptyState title="Không tìm thấy tài khoản" description="Thử đổi bộ lọc hoặc tạo tài khoản mới." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Liên kết nhân sự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  {canEdit && <TableHead className="w-[100px] text-right">Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleChangeRole(user, newRole)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABEL).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                          <Shield className="size-3" />
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.employeeId ? (
                        <span className="text-sm">
                          {user.employeeFullName}{' '}
                          <span className="text-xs text-muted-foreground">({user.employeeCode})</span>
                          {user.departmentName && (
                            <span className="block text-xs text-muted-foreground">{user.departmentName}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Không liên kết</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                            user.isActive
                              ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'
                          }`}
                        >
                          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            user.isActive
                              ? 'bg-green-50 text-green-700 ring-green-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'
                          }`}
                        >
                          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem onClick={() => handleOpenResetPassword(user)}>
                              <KeyRound className="mr-2 size-4" />
                              Đặt lại mật khẩu
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              <UserX className="mr-2 size-4" />
                              {user.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-sm text-muted-foreground">
                Hiển thị {users.length} trên tổng số {totalCount} dòng
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="text-sm font-medium">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <UserFormDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onSubmit={handleCreateUser}
      />

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onSubmit={handleResetPassword}
      />
    </div>
  )
}
