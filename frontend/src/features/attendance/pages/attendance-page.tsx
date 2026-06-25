import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Briefcase, ChevronLeft, ChevronRight, Clock, Loader2, LogIn, LogOut, MapPin, Moon, QrCode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { AttendanceRecord } from '@/features/attendance/types'

type CheckState = 'not-checked-in' | 'checked-in' | 'checked-out'
type ViewMode = 'Tuần' | 'Tháng'

// ─── KPI Cards ───────────────────────────────────────────────────────────────

function AttendanceKpiCards({ records, year, month }: {
  records: AttendanceRecord[]
  year: number
  month: number
}) {
  const stats = useMemo(() => {
    const inPeriod = records.filter((r) => {
      const d = new Date(r.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    const totalHours = inPeriod.reduce((s, r) => s + (r.totalHours ?? 0), 0)
    const otHours = inPeriod.reduce((s, r) => s + (r.overtimeHours ?? 0), 0)
    const late = inPeriod.filter((r) => r.status === 'Late' || r.status === 'EarlyLeave').length
    const absent = inPeriod.filter((r) => r.status === 'Absent').length
    const workDays = inPeriod.filter((r) => r.checkIn).length
    return { workDays, totalHours, otHours, late, absent }
  }, [records, year, month])

  const cards = [
    { label: 'Tổng công hưởng lương', value: stats.workDays, icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Tổng giờ làm thêm', value: `${stats.otHours.toFixed(1)}h`, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Tổng số lần đi muộn, về sớm', value: stats.late, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Tổng số ca nghỉ', value: stats.absent, icon: Moon, color: 'text-destructive', bg: 'bg-destructive/10' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold">{c.value}</p>
            </div>
            <div className={`rounded-lg p-2 ${c.bg}`}>
              <c.icon className={`size-5 ${c.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  Present:    'bg-success',
  Late:       'bg-warning',
  EarlyLeave: 'bg-orange-400',
  Absent:     'bg-destructive',
  HalfDay:    'bg-blue-400',
}

function MonthCalendar({ records, year, month }: {
  records: AttendanceRecord[]
  year: number
  month: number
}) {
  const today = new Date()
  const byDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {}
    records.forEach((r) => { map[r.date] = r })
    return map
  }, [records])

  // Build calendar grid (Mon–Sun)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)
  // 0=Sun,1=Mon...6=Sat → shift so Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const DAY_HEADERS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((h, i) => (
          <div
            key={h}
            className={`py-2 text-center text-xs font-medium ${i >= 5 ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[72px] border-b border-r border-border bg-muted/20 last:border-r-0"
              />
            )
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const rec = byDate[dateStr]
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() + 1 === month &&
            today.getDate() === day
          const isWeekend = ((idx % 7) >= 5)

          return (
            <div
              key={dateStr}
              className={`relative min-h-[72px] border-b border-r border-border p-1.5 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
            >
              <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                isToday
                  ? 'bg-primary text-primary-foreground'
                  : isWeekend
                  ? 'text-destructive'
                  : 'text-foreground'
              }`}>
                {day}
              </span>

              {rec && (
                <div className="mt-1 space-y-0.5">
                  {rec.checkIn && (
                    <div className="truncate rounded bg-success/10 px-1 py-0.5 text-[10px] text-success">
                      {rec.checkIn}
                    </div>
                  )}
                  {rec.checkOut && (
                    <div className="truncate rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                      {rec.checkOut}
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className={`inline-block size-2 rounded-full ${STATUS_DOT[rec.status] ?? 'bg-muted-foreground'}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {rec.totalHours ? `${rec.totalHours.toFixed(1)}h` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ records, weekStart }: { records: AttendanceRecord[]; weekStart: Date }) {
  const byDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {}
    records.forEach((r) => { map[r.date] = r })
    return map
  }, [records])

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const DAY_LABELS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const rec = byDate[dateStr]
        const isToday = dateStr === (() => {
          const t = new Date()
          return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
        })()

        return (
          <Card key={dateStr} className={`p-3 ${isToday ? 'border-primary' : ''} ${i >= 5 ? 'opacity-60' : ''}`}>
            <p className={`text-xs font-medium ${i >= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {DAY_LABELS[i]}
            </p>
            <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</p>
            {rec ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-success">▲ {rec.checkIn ?? '—'}</div>
                <div className="text-muted-foreground">▼ {rec.checkOut ?? '—'}</div>
                {rec.totalHours && <div className="font-medium">{rec.totalHours.toFixed(1)}h</div>}
                <AttendanceStatusBadge status={rec.status} />
              </div>
            ) : (
              <div className="mt-2 text-xs text-muted-foreground">—</div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AttendancePage() {
  const [now, setNow] = useState(() => new Date())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Tháng')
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)

  // Week state: start of current week (Mon)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  })

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const { data: records = [], isLoading, isError, refetch } = useMyAttendance()
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayRecord = records.find((r) => r.date === todayStr)

  const checkState: CheckState = (() => {
    if (!todayRecord) return 'not-checked-in'
    if (todayRecord.checkIn && !todayRecord.checkOut) return 'checked-in'
    return 'checked-out'
  })()

  const getCoords = (): Promise<{ latitude?: number; longitude?: number }> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) { resolve({}); return }
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

  // Month navigation
  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }
  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })

  const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                       'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

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

      {/* Check-in card + table */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-4xl font-bold tabular-nums">{now.toLocaleTimeString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground capitalize">
            {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>

          {checkState === 'not-checked-in' && (
            <Button onClick={handleCheckIn} className="bg-success text-success-foreground hover:bg-success/90 min-w-[120px]" disabled={isMutating || isLoading}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Check In
            </Button>
          )}
          {checkState === 'checked-in' && (
            <Button onClick={handleCheckOut} variant="destructive" className="min-w-[120px]" disabled={isMutating || isLoading}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
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
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> Vị trí GPS được xác thực khi check-in</span>
            <span className="flex items-center gap-1"><QrCode className="size-3.5" /> Hỗ trợ chấm công qua QR Code</span>
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
              <EmptyState icon={LogIn} title="Chưa có dữ liệu chấm công" description="Bạn chưa thực hiện Check In ngày nào." />
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
                      <TableCell>{record.totalHours !== null ? record.totalHours.toFixed(1) : '—'}</TableCell>
                      <TableCell className="tabular-nums">{record.overtimeHours ? `${record.overtimeHours.toFixed(1)}h` : '—'}</TableCell>
                      <TableCell><AttendanceStatusBadge status={record.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bảng chấm công lịch ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Toggle Tuần / Tháng */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(['Tuần', 'Tháng'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Navigator */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={viewMode === 'Tháng' ? prevMonth : prevWeek}>
              <ChevronLeft className="size-4" />
            </Button>

            {viewMode === 'Tháng' ? (
              <div className="flex items-center gap-1.5">
                {/* Dropdown Tháng */}
                <Select value={String(calMonth)} onValueChange={(v) => setCalMonth(Number(v))}>
                  <SelectTrigger className="h-8 w-[110px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Dropdown Năm */}
                <Select value={String(calYear)} onValueChange={(v) => setCalYear(Number(v))}>
                  <SelectTrigger className="h-8 w-[80px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="min-w-[180px] text-center text-sm font-medium">
                {weekStart.getDate()}/{weekStart.getMonth() + 1} – {weekEnd.getDate()}/{weekEnd.getMonth() + 1}/{weekEnd.getFullYear()}
              </span>
            )}

            <Button variant="outline" size="icon" onClick={viewMode === 'Tháng' ? nextMonth : nextWeek}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const t = new Date()
              setCalYear(t.getFullYear())
              setCalMonth(t.getMonth() + 1)
              const day = t.getDay()
              const diff = (day === 0 ? -6 : 1 - day)
              const ws = new Date(t)
              ws.setDate(t.getDate() + diff)
              ws.setHours(0,0,0,0)
              setWeekStart(ws)
            }}>
              Hôm nay
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {!isLoading && !isError && (
          <AttendanceKpiCards records={records} year={calYear} month={calMonth} />
        )}

        {/* Calendar / Week view */}
        {isLoading && <TableSkeleton rows={6} columns={7} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && (
          viewMode === 'Tháng'
            ? <MonthCalendar records={records} year={calYear} month={calMonth} />
            : <WeekView records={records} weekStart={weekStart} />
        )}
      </div>
    </div>
  )
}
