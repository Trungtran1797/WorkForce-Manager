import { useState } from 'react'
import { CalendarOff, Check, Plus, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { LeaveStatusBadge } from '@/components/common/status-badge'
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
import { LeaveRequestDialog } from '@/features/leave/components/leave-request-dialog'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { ApiError } from '@/lib/api-client'
import {
  useApproveLeaveRequest,
  useCreateLeaveRequest,
  useMyLeaveRequests,
  usePendingLeaveRequests,
  useRejectLeaveRequest,
} from '@/features/leave/api/leave-queries'
import type { LeaveFormValues, LeaveRequest } from '@/features/leave/types'

const LEAVE_TYPE_LABEL: Record<LeaveRequest['leaveType'], string> = {
  Annual: 'Nghỉ phép',
  Sick: 'Nghỉ ốm',
  Unpaid: 'Nghỉ không lương',
}

export function LeavePage() {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'SuperAdmin'
  const canEdit = useCanEdit('Leave')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my')

  // Queries
  const {
    data: myRequests = [],
    isLoading: isMyLoading,
    isError: isMyError,
    refetch: refetchMy,
  } = useMyLeaveRequests()

  const {
    data: pendingRequests = [],
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = usePendingLeaveRequests()

  // Mutations
  const createMutation = useCreateLeaveRequest()
  const approveMutation = useApproveLeaveRequest()
  const rejectMutation = useRejectLeaveRequest()

  const handleCreateRequest = async (values: LeaveFormValues): Promise<void> => {
    try {
      await createMutation.mutateAsync(values)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Đăng ký nghỉ phép thất bại.')
    }
  }

  const handleApprove = async (id: string): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt đơn xin nghỉ phép này không?')) {
      try {
        await approveMutation.mutateAsync(id)
      } catch (err) {
        alert(err instanceof ApiError ? err.message : 'Duyệt đơn nghỉ phép thất bại.')
      }
    }
  }

  const handleReject = async (id: string): Promise<void> => {
    const reason = window.prompt('Nhập lý do từ chối đơn:')
    if (reason === null) return
    if (!reason.trim()) {
      alert('Lý do từ chối không được để trống.')
      return
    }

    try {
      await rejectMutation.mutateAsync({ id, reason: reason.trim() })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Từ chối đơn nghỉ phép thất bại.')
    }
  }

  const renderTable = (
    list: LeaveRequest[],
    isLoading: boolean,
    isError: boolean,
    onRetry: () => void,
    showActions: boolean
  ) => {
    if (isLoading) {
      return <TableSkeleton rows={5} columns={7} />
    }

    if (isError) {
      return <ErrorState onRetry={onRetry} />
    }

    if (list.length === 0) {
      return (
        <EmptyState
          icon={CalendarOff}
          title="Chưa có đơn nghỉ phép"
          description={showActions ? "Không có đơn nghỉ phép nào đang chờ bạn duyệt." : "Bạn chưa tạo đơn xin nghỉ phép nào."}
        />
      )
    }

    const isMutating = approveMutation.isPending || rejectMutation.isPending

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Loại nghỉ</TableHead>
            <TableHead>Từ ngày</TableHead>
            <TableHead>Đến ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            {showActions && <TableHead className="text-right">Hành động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.employeeName}</TableCell>
              <TableCell>{LEAVE_TYPE_LABEL[request.leaveType] || request.leaveType}</TableCell>
              <TableCell>{formatDate(request.startDate)}</TableCell>
              <TableCell>{formatDate(request.endDate)}</TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground" title={request.reason}>
                {request.reason}
              </TableCell>
              <TableCell>
                <LeaveStatusBadge status={request.status} />
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  {canEdit && (
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
                  )}
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
          <h1 className="text-2xl font-semibold">Nghỉ phép</h1>
          <p className="text-sm text-muted-foreground">
            Đăng ký và duyệt nghỉ phép theo quy trình Employee → Manager → HR
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Đăng ký nghỉ
          </Button>
        )}
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

      <LeaveRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateRequest}
      />
    </div>
  )
}
