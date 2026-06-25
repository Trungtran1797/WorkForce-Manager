import { useState } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { ContractStatusBadge } from '@/components/common/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatMoney } from '@/lib/formatters'
import { ApiError } from '@/lib/api-client'
import { ContractFormDialog } from '@/features/contracts/components/contract-form-dialog'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { useContracts, useDeleteContract, useSaveContract } from '@/features/contracts/api/contract-queries'
import type { Contract, ContractFormValues, ContractType } from '@/features/contracts/types'

const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  Probation: 'Thử việc',
  Official: 'Chính thức',
  Appendix: 'Phụ lục',
}

export function ContractsPage() {
  const canEdit = useCanEdit('Contracts')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)

  const { data: contracts = [], isLoading, isError, refetch } = useContracts(search)
  const saveMutation = useSaveContract()
  const deleteMutation = useDeleteContract()

  const handleSave = async (values: ContractFormValues): Promise<void> => {
    try {
      await saveMutation.mutateAsync({ id: editing?.id ?? 0, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu hợp đồng thất bại.')
      throw err
    }
  }

  const handleDelete = async (contract: Contract): Promise<void> => {
    if (!window.confirm(`Xóa hợp đồng "${contract.contractCode}"?`)) return
    try {
      await deleteMutation.mutateAsync(contract.id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa hợp đồng thất bại.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (contract: Contract) => {
    setEditing(contract)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hợp đồng lao động</h1>
          <p className="text-sm text-muted-foreground">Quản lý hồ sơ hợp đồng: thử việc, chính thức, phụ lục.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm hợp đồng
          </Button>
        )}
      </div>

      <Input
        placeholder="Tìm theo mã hợp đồng hoặc tên nhân viên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={5} columns={7} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && contracts.length === 0 && (
          <EmptyState
            icon={FileText}
            title="Chưa có hợp đồng"
            description="Thêm hợp đồng lao động cho nhân viên."
            actionLabel={canEdit ? 'Thêm hợp đồng' : undefined}
            onAction={canEdit ? openCreate : undefined}
          />
        )}
        {!isLoading && !isError && contracts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Hiệu lực</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canEdit && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractCode}</TableCell>
                  <TableCell>{contract.employeeName}</TableCell>
                  <TableCell>{CONTRACT_TYPE_LABEL[contract.contractType]}</TableCell>
                  <TableCell>
                    {formatDate(contract.startDate)}
                    {contract.endDate ? ` – ${formatDate(contract.endDate)}` : ''}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatMoney(contract.baseSalary)}</TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(contract)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(contract)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ContractFormDialog open={dialogOpen} onOpenChange={setDialogOpen} contract={editing} onSubmit={handleSave} />
    </div>
  )
}
