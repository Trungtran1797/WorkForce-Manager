import { useState } from 'react'
import { Coins, Pencil, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/formatters'
import { ApiError } from '@/lib/api-client'
import { SalaryConfigDialog } from '@/features/salary-configs/components/salary-config-dialog'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { useSalaryConfigs, useSaveSalaryConfig } from '@/features/salary-configs/api/salary-config-queries'
import type { SalaryConfig, SalaryConfigFormValues } from '@/features/salary-configs/types'

export function SalaryConfigPage() {
  const canEdit = useCanEdit('SalaryConfigs')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryConfig | null>(null)

  const { data: configs = [], isLoading, isError, refetch } = useSalaryConfigs()
  const saveMutation = useSaveSalaryConfig()

  const handleSave = async (values: SalaryConfigFormValues): Promise<void> => {
    try {
      await saveMutation.mutateAsync(values)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu cấu hình lương thất bại.')
      throw err
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (config: SalaryConfig) => {
    setEditing(config)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cấu hình lương</h1>
          <p className="text-sm text-muted-foreground">Lương cơ bản, phụ cấp, mức đóng BH và giảm trừ gia cảnh.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm cấu hình
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={5} columns={6} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && configs.length === 0 && (
          <EmptyState
            icon={Coins}
            title="Chưa có cấu hình lương"
            description="Thêm cấu hình lương cho nhân viên để tính bảng lương."
            actionLabel={canEdit ? 'Thêm cấu hình' : undefined}
            onAction={canEdit ? openCreate : undefined}
          />
        )}
        {!isLoading && !isError && configs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>Phụ cấp</TableHead>
                <TableHead>Lương đóng BH</TableHead>
                <TableHead>Người phụ thuộc</TableHead>
                {canEdit && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{config.employeeName}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(config.baseSalary)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(config.allowance)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(config.insuranceSalary)}</TableCell>
                  <TableCell className="tabular-nums">{config.dependentCount}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(config)}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <SalaryConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} config={editing} onSubmit={handleSave} />
    </div>
  )
}
