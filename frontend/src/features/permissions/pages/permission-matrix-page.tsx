import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorState } from '@/components/common/data-state'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSION_MODULES } from '@/features/permissions/types'
import { useGetPermissionMatrix, useUpdatePermissionMatrix } from '@/features/permissions/api/permission-queries'
import type {
  DepartmentOverrideDto,
  PermissionLevel,
  RolePermissionDto,
} from '@/features/permissions/types'

const LEVEL_LABEL: Record<PermissionLevel, string> = {
  None: 'Không truy cập',
  View: 'Chỉ xem',
  Edit: 'Chỉnh sửa',
}

const LEVEL_OPTIONS: PermissionLevel[] = ['None', 'View', 'Edit']

function PermissionLevelSelect({
  value,
  onChange,
  disabled,
}: {
  value: PermissionLevel
  onChange: (value: PermissionLevel) => void
  disabled?: boolean
}) {
  if (disabled) {
    return <span className="text-sm font-medium text-success">{LEVEL_LABEL.Edit}</span>
  }

  return (
    <Select value={value} onValueChange={(val) => onChange(val as PermissionLevel)}>
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEVEL_OPTIONS.map((level) => (
          <SelectItem key={level} value={level}>
            {LEVEL_LABEL[level]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MatrixSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function PermissionMatrixPage() {
  const { data, isLoading, isError, refetch } = useGetPermissionMatrix()
  const updateMutation = useUpdatePermissionMatrix()

  const [rolePermissions, setRolePermissions] = useState<RolePermissionDto[]>([])
  const [departmentOverrides, setDepartmentOverrides] = useState<DepartmentOverrideDto[]>([])

  useEffect(() => {
    if (!data) return
    setRolePermissions(data.rolePermissions)
    setDepartmentOverrides(data.departmentOverrides)
  }, [data])

  const getRoleLevel = (role: string, module: string): PermissionLevel =>
    rolePermissions.find((item) => item.role === role && item.module === module)?.level ?? 'None'

  const setRoleLevel = (role: string, module: string, level: PermissionLevel): void => {
    setRolePermissions((prev) => {
      const exists = prev.some((item) => item.role === role && item.module === module)
      if (exists) {
        return prev.map((item) =>
          item.role === role && item.module === module ? { ...item, level } : item,
        )
      }
      return [...prev, { role, module, level }]
    })
  }

  const getDepartmentLevel = (departmentId: number, module: string): PermissionLevel =>
    departmentOverrides.find((item) => item.departmentId === departmentId && item.module === module)
      ?.level ?? 'None'

  const setDepartmentLevel = (
    departmentId: number,
    departmentName: string,
    module: string,
    level: PermissionLevel,
  ): void => {
    setDepartmentOverrides((prev) => {
      const exists = prev.some((item) => item.departmentId === departmentId && item.module === module)
      if (exists) {
        return prev.map((item) =>
          item.departmentId === departmentId && item.module === module ? { ...item, level } : item,
        )
      }
      return [...prev, { departmentId, departmentName, module, level }]
    })
  }

  const handleSave = (): void => {
    updateMutation.mutate({ rolePermissions, departmentOverrides })
  }

  const roles = data?.roles ?? ['SuperAdmin', 'Manager', 'Employee']
  const departments = data?.departments ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Phân quyền</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình mức quyền truy cập (Không truy cập / Chỉ xem / Chỉnh sửa) theo vai trò và phòng ban.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isLoading || isError || updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Lưu
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && <MatrixSkeleton />}
        {isError && <ErrorState onRetry={() => void refetch()} />}

        {!isLoading && !isError && (
          <Tabs defaultValue="role" className="p-4">
            <TabsList>
              <TabsTrigger value="role">Theo vai trò</TabsTrigger>
              <TabsTrigger value="department">Theo phòng ban</TabsTrigger>
            </TabsList>

            <TabsContent value="role" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role}>{role}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_MODULES.map((module) => (
                      <TableRow key={module.key}>
                        <TableCell className="font-medium">{module.label}</TableCell>
                        {roles.map((role) => (
                          <TableCell key={role}>
                            <PermissionLevelSelect
                              value={getRoleLevel(role, module.key)}
                              onChange={(level) => setRoleLevel(role, module.key, level)}
                              disabled={role === 'SuperAdmin'}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="department" className="mt-4">
              {departments.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Chưa có phòng ban nào để cấu hình quyền bổ sung.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card">Phòng ban</TableHead>
                        {PERMISSION_MODULES.map((module) => (
                          <TableHead key={module.key} className="whitespace-nowrap">
                            {module.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell className="sticky left-0 bg-card font-medium whitespace-nowrap">
                            {department.name}
                          </TableCell>
                          {PERMISSION_MODULES.map((module) => (
                            <TableCell key={module.key}>
                              <PermissionLevelSelect
                                value={getDepartmentLevel(department.id, module.key)}
                                onChange={(level) =>
                                  setDepartmentLevel(department.id, department.name, module.key, level)
                                }
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  )
}
