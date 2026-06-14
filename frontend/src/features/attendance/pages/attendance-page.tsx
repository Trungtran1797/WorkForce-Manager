import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, LogIn, LogOut, MapPin, QrCode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceStatusBadge } from '@/components/common/status-badge'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
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
import {
  useCheckIn,
  useCheckOut,
  useMyAttendance,
} from '@/features/attendance/api/attendance-queries'

type CheckState = 'not-checked-in' | 'checked-in' | 'checked-out'

export function AttendancePage() {
  const [now, setNow] = useState(() => new Date())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const { data: records = [], isLoading, isError, refetch } = useMyAttendance()
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  // Tìm bản ghi ngày hôm nay (so khớp theo chuỗi yyyy-MM-dd)
  const todayStr = (() => {
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })()

  const todayRecord = records.find((r) => r.date === todayStr)

  const checkState: CheckState = (() => {
    if (!todayRecord) return 'not-checked-in'
    if (todayRecord.checkIn && !todayRecord.checkOut) return 'checked-in'
    return 'checked-out'
  })()

  // Lấy tọa độ GPS (nếu trình duyệt cho phép) để gửi kèm check-in; từ chối vẫn cho check-in.
  const getCoords = (): Promise<{ latitude?: number; longitude?: number }> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({})
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({}),
        { timeout: 8000, enableHighAccuracy: true },
      )
    })

  const handleCheckIn = async (): Promise<void> => {
    setErrorMessage(null)
    try {
      const coords = await getCoords()
      await checkInMutation.mutateAsync(coords)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Check-in thất bại. Vui lòng thử lại.')
    }
  }

  const handleCheckOut = async (): Promise<void> => {
    setErrorMessage(null)
    try {
      await checkOutMutation.mutateAsync(undefined)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Check-out thất bại. Vui lòng thử lại.')
    }
  }

  const isMutating = checkInMutation.isPending || checkOutMutation.isPending

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Chấm công</h1>
        <p className="text-sm text-muted-foreground">Check In / Check Out hằng ngày</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-4xl font-bold tabular-nums">
            {now.toLocaleTimeString('vi-VN')}
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {now.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>

          {checkState === 'not-checked-in' && (
            <Button
              onClick={handleCheckIn}
              className="bg-success text-success-foreground hover:bg-success/90 min-w-[120px]"
              disabled={isMutating || isLoading}
            >
              {isMutating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Check In
            </Button>
          )}

          {checkState === 'checked-in' && (
            <Button
              onClick={handleCheckOut}
              variant="destructive"
              className="min-w-[120px]"
              disabled={isMutating || isLoading}
            >
              {isMutating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Check Out
            </Button>
          )}

          {checkState === 'checked-out' && (
            <div className="rounded-lg bg-success/10 px-3 py-1 text-sm font-medium text-success">
              Đã hoàn thành chấm công hôm nay
            </div>
          )}

          {todayRecord && !todayRecord.locationValid && (
            <div className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
              <AlertCircle className="size-3.5" /> Check-in ngoài vùng cho phép
            </div>
          )}

          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> Vị trí GPS được xác thực khi check-in
            </span>
            <span className="flex items-center gap-1">
              <QrCode className="size-3.5" /> Hỗ trợ chấm công qua QR Code
            </span>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <CardTitle>Bảng chấm công theo ngày</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && <TableSkeleton rows={5} columns={5} />}

            {isError && <ErrorState onRetry={() => void refetch()} />}

            {!isLoading && !isError && records.length === 0 && (
              <EmptyState
                icon={LogIn}
                title="Chưa có dữ liệu chấm công"
                description="Bạn chưa thực hiện Check In ngày nào."
              />
            )}

            {!isLoading && !isError && records.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Ca</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Số giờ</TableHead>
                    <TableHead>OT</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell className="text-muted-foreground">{record.shiftName ?? '—'}</TableCell>
                      <TableCell>{record.checkIn ?? '—'}</TableCell>
                      <TableCell>{record.checkOut ?? '—'}</TableCell>
                      <TableCell>
                        {record.totalHours !== null ? record.totalHours.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {record.overtimeHours ? `${record.overtimeHours.toFixed(1)}h` : '—'}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadge status={record.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
