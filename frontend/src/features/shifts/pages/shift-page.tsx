import { useMemo, useState } from 'react'
import { CalendarClock, Clock, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
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
import { ApiError } from '@/lib/api-client'
import { ShiftFormDialog } from '@/features/shifts/components/shift-form-dialog'
import { AssignShiftDialog } from '@/features/shifts/components/assign-shift-dialog'
import {
  useAssignShift,
  useCreateShift,
  useDeleteShift,
  useShiftSchedule,
  useShifts,
  useUpdateShift,
} from '@/features/shifts/api/shift-queries'
import type { AssignShiftValues, Shift, ShiftFormValues, ShiftType } from '@/features/shifts/types'

const SHIFT_TYPE_LABEL: Record<ShiftType, string> = {
  Administrative: 'Hành chính',
  Shift: 'Ca kíp',
  Night: 'Ca đêm',
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function ShiftPage() {
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  // Tuần hiện tại (7 ngày từ hôm nay).
  const { startDate, endDate } = useMemo(() => {
    const today = new Date()
    const end = new Date(today)
    end.setDate(today.getDate() + 6)
    return { startDate: toIsoDate(today), endDate: toIsoDate(end) }
  }, [])

  const { data: shifts = [], isLoading, isError, refetch } = useShifts()
  const {
    data: schedule = [],
    isLoading: isScheduleLoading,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useShiftSchedule(startDate, endDate)

  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const deleteMutation = useDeleteShift()
  const assignMutation = useAssignShift()

  const handleSaveShift = async (values: ShiftFormValues): Promise<void> => {
    try {
      if (editingShift) {
        await updateMutation.mutateAsync({ id: editingShift.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu ca làm việc thất bại.')
      throw err
    }
  }

  const handleDelete = async (shift: Shift): Promise<void> => {
    if (!window.confirm(`Xóa ca "${shift.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(shift.id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa ca làm việc thất bại.')
    }
  }

  const handleAssign = async (values: AssignShiftValues): Promise<void> => {
    try {
      await assignMutation.mutateAsync(values)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Phân ca thất bại.')
      throw err
    }
  }

  const openCreate = () => {
    setEditingShift(null)
    setShiftDialogOpen(true)
  }

  const openEdit = (shift: Shift) => {
    setEditingShift(shift)
    setShiftDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ca làm việc</h1>
        <p className="text-sm text-muted-foreground">Cấu hình ca làm việc và phân ca cho nhân viên.</p>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Cấu hình ca</TabsTrigger>
          <TabsTrigger value="schedule">Phân ca (tuần này)</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-3 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Thêm ca
            </Button>
          </div>
          <Card className="p-0 overflow-hidden">
            {isLoading && <TableSkeleton rows={4} columns={6} />}
            {isError && <ErrorState onRetry={() => void refetch()} />}
            {!isLoading && !isError && shifts.length === 0 && (
              <EmptyState icon={Clock} title="Chưa có ca làm việc" description="Thêm ca làm việc để bắt đầu phân ca." actionLabel="Thêm ca" onAction={openCreate} />
            )}
            {!isLoading && !isError && shifts.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên ca</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Nghỉ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.code}</TableCell>
                      <TableCell>{shift.name}</TableCell>
                      <TableCell className="tabular-nums">{shift.startTime} – {shift.endTime}</TableCell>
                      <TableCell>{shift.breakMinutes} phút</TableCell>
                      <TableCell>{SHIFT_TYPE_LABEL[shift.shiftType]}</TableCell>
                      <TableCell>
                        <Badge variant={shift.isActive ? 'success' : 'gray'}>
                          {shift.isActive ? 'Đang áp dụng' : 'Ngừng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(shift)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(shift)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatDate(startDate)} – {formatDate(endDate)}
            </p>
            <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
              <CalendarClock className="size-4" />
              Phân ca
            </Button>
          </div>
          <Card className="p-0 overflow-hidden">
            {isScheduleLoading && <TableSkeleton rows={4} columns={4} />}
            {isScheduleError && <ErrorState onRetry={() => void refetchSchedule()} />}
            {!isScheduleLoading && !isScheduleError && schedule.length === 0 && (
              <EmptyState icon={CalendarClock} title="Chưa phân ca tuần này" description="Bấm nút Phân ca để gán ca cho nhân viên." />
            )}
            {!isScheduleLoading && !isScheduleError && schedule.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ca</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.workDate)}</TableCell>
                      <TableCell className="font-medium">{item.employeeName}</TableCell>
                      <TableCell>{item.shiftName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.note ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ShiftFormDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        shift={editingShift}
        onSubmit={handleSaveShift}
      />
      <AssignShiftDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        defaultDate={startDate}
        onSubmit={handleAssign}
      />
    </div>
  )
}
