import { useState } from 'react'
import { Pencil, Plus, Target, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/data-state'
import { OkrStatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/features/auth/context/auth-context'
import { ObjectiveFormDialog } from '@/features/okrs/components/objective-form-dialog'
import { KeyResultRow } from '@/features/okrs/components/key-result-row'
import {
  useDeleteObjective,
  useOkrs,
  useSaveObjective,
  useUpdateKeyResultProgress,
} from '@/features/okrs/api/okr-queries'
import type { ObjectiveFormValues, OkrObjective } from '@/features/okrs/types'

function currentPeriod(): string {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return `${now.getFullYear()}-Q${quarter}`
}

export function OkrsPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'Manager'

  const [period, setPeriod] = useState(currentPeriod())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OkrObjective | null>(null)

  const { data: objectives = [], isLoading, isError, refetch } = useOkrs({ period: period || undefined })
  const saveMutation = useSaveObjective()
  const updateProgressMutation = useUpdateKeyResultProgress()
  const deleteMutation = useDeleteObjective()

  const handleSave = async (values: ObjectiveFormValues): Promise<void> => {
    try {
      await saveMutation.mutateAsync({ id: editing?.id ?? 0, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu mục tiêu thất bại.')
      throw err
    }
  }

  const handleUpdateProgress = async (keyResultId: number, currentValue: number): Promise<void> => {
    try {
      await updateProgressMutation.mutateAsync({ keyResultId, currentValue })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cập nhật tiến độ thất bại.')
    }
  }

  const handleDelete = async (objective: OkrObjective): Promise<void> => {
    if (!window.confirm(`Xóa mục tiêu "${objective.title}"?`)) return
    try {
      await deleteMutation.mutateAsync(objective.id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa mục tiêu thất bại.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (objective: OkrObjective) => {
    setEditing(objective)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mục tiêu (OKRs)</h1>
          <p className="text-sm text-muted-foreground">Theo dõi mục tiêu &amp; kết quả then chốt theo từng kỳ.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm mục tiêu
          </Button>
        )}
      </div>

      <Input
        placeholder="Kỳ (VD: 2026-Q2) — để trống để xem tất cả"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="max-w-xs"
      />

      {isLoading && <CardGridSkeleton count={4} />}
      {isError && (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      )}
      {!isLoading && !isError && objectives.length === 0 && (
        <Card>
          <EmptyState
            icon={Target}
            title="Chưa có mục tiêu nào"
            description="Tạo mục tiêu OKR đầu tiên cho kỳ này."
            actionLabel={canManage ? 'Thêm mục tiêu' : undefined}
            onAction={canManage ? openCreate : undefined}
          />
        </Card>
      )}

      {!isLoading && !isError && objectives.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {objectives.map((objective) => (
            <Card key={objective.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">{objective.title}</p>
                  {objective.description && (
                    <p className="text-sm text-muted-foreground">{objective.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {objective.ownerType === 'Department'
                      ? `Phòng ban: ${objective.departmentName ?? '—'}`
                      : `Cá nhân: ${objective.employeeName ?? '—'}`}{' '}
                    · Kỳ {objective.period}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <OkrStatusBadge status={objective.status} />
                  {canManage && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(objective)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(objective)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tiến độ tổng thể</span>
                  <span>{objective.progress.toFixed(0)}%</span>
                </div>
                <ProgressBar value={objective.progress} />
              </div>

              <div className="space-y-2">
                {objective.keyResults.map((kr) => (
                  <KeyResultRow key={kr.id} keyResult={kr} onUpdateProgress={handleUpdateProgress} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ObjectiveFormDialog open={dialogOpen} onOpenChange={setDialogOpen} objective={editing} onSubmit={handleSave} />
    </div>
  )
}
