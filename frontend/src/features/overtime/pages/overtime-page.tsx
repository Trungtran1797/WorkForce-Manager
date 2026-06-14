import { useState } from 'react'
import { Check, Clock, Loader2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { OvertimeStatusBadge } from '@/components/common/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { OvertimeRequestDialog } from '@/features/overtime/components/overtime-request-dialog'
import { useAuth } from '@/features/auth/context/auth-context'
import { ApiError } from '@/lib/api-client'
import {
  useApproveOvertime,
  useCreateOvertime,
  useMyOvertime,
  usePendingOvertime,
  useRejectOvertime,
} from '@/features/overtime/api/overtime-queries'
import type { OvertimeFormValues, OvertimeRequest } from '@/features/overtime/types'

export function OvertimePage() {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'SuperAdmin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my')

  const { data: myRequests = [], isLoading: isMyLoading, isError: isMyError, refetch: refetchMy } = useMyOvertime()
  const {
    data: pendingRequests = [],
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = usePendingOvertime()

  const createMutation = useCreateOvertime()
  const approveMutation = useApproveOvertime()
  const rejectMutation = useRejectOvertime()

  const handleCreate = async (values: OvertimeFormValues): Promise<void> => {
    try {
      await createMutation.mutateAsync(values)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gửi đơn làm thêm giờ thất bại.')
    }
  }

  const handleApprove = async (id: string): Promise<void> => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt đơn làm thêm giờ này không?')) return
    try {
      await approveMutation.mutateAsync(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Duyệt đơn thất bại.')
    }
  }

  const handleReject = async (id: string): Promise<void> => {
    const reason = window.prompt('Nhập lý do từ chối đơn:')
    if (reason === null) return
    try {
      await rejectMutation.mutateAsync({ id, rejectReason: reason.trim() })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Từ chối đơn thất bại.')
    }
  }

  const renderTable = (
    list: OvertimeRequest[],
    isLoading: boolean,
    isError: boolean,
    onRetry: () => void,
    showActions: boolean,
  ) => {
    if (isLoading) return <TableSkeleton rows={5} columns={showActions ? 7 : 6} />
    if (isError) return <ErrorState onRetry={onRetry} />
    if (list.length === 0) {
      return (
        <EmptyState
          icon={Clock}
          title="Chưa có đơn làm thêm giờ"
          description={showActions ? 'Không có đơn nào đang chờ bạn duyệt.' : 'Bạn chưa đăng ký làm thêm giờ.'}
        />
      )
    }

    const isMutating = approveMutation.isPending || rejectMutation.isPending

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Giờ bắt đầu</TableHead>
            <TableHead>Giờ kết thúc</TableHead>
            <TableHead>Số giờ</TableHead>
            <TableHead>Trạng thái</TableHead>
            {showActions && <TableHead className="text-right">Hành động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.employeeName}</TableCell>
              <TableCell>{formatDate(request.date)}</TableCell>
              <TableCell>{request.startTime}</TableCell>
              <TableCell>{request.endTime}</TableCell>
              <TableCell className="tabular-nums">{request.hours.toFixed(1)}h</TableCell>
              <TableCell>
                <OvertimeStatusBadge status={request.status} />
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success/30 text-success hover:bg-success/10"
                      onClick={() => handleApprove(request.id)}
                      disabled={isMutating}
                    >
                      {isMutating && approveMutation.variables === request.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(request.id)}
                      disabled={isMutating}
                    >
                      <X className="size-3.5" />
                      Từ chối
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tăng ca</h1>
          <p className="text-sm text-muted-foreground">
            Đăng ký và duyệt làm thêm giờ (OT) — giờ OT được tính vào bảng công khi duyệt.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Đăng ký OT
        </Button>
      </div>

      {isManagerOrAdmin ? (
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'my' | 'pending')}>
          <TabsList>
            <TabsTrigger value="my">Đơn của tôi</TabsTrigger>
            <TabsTrigger value="pending">
              Cần duyệt
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Card className="mt-2 p-0 overflow-hidden">
            <TabsContent value="my" className="m-0 border-0">
              {renderTable(myRequests, isMyLoading, isMyError, refetchMy, false)}
            </TabsContent>
            <TabsContent value="pending" className="m-0 border-0">
              {renderTable(pendingRequests, isPendingLoading, isPendingError, refetchPending, true)}
            </TabsContent>
          </Card>
        </Tabs>
      ) : (
        <Card className="p-0 overflow-hidden">
          {renderTable(myRequests, isMyLoading, isMyError, refetchMy, false)}
        </Card>
      )}

      <OvertimeRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
    </div>
  )
}
