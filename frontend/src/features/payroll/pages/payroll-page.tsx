import { useState } from 'react'
import { Calculator, Check, Eye, Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { PayslipStatusBadge } from '@/components/common/status-badge'
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
import { useDepartments } from '@/features/departments/api/department-queries'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { PayslipDetailDialog } from '@/features/payroll/components/payslip-detail-dialog'
import {
  useApprovePayslip,
  useGeneratePayroll,
  usePayslips,
  useSendPayslipEmail,
} from '@/features/payroll/api/payroll-queries'
import type { Payslip } from '@/features/payroll/types'

const ALL_DEPARTMENTS = 'all'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function PayrollPage() {
  const canEdit = useCanEdit('Payroll')
  const [period, setPeriod] = useState(currentMonth())
  const [departmentId, setDepartmentId] = useState<string>(ALL_DEPARTMENTS)
  const [standardDays, setStandardDays] = useState(26)
  const [detail, setDetail] = useState<Payslip | null>(null)

  const deptFilter = departmentId === ALL_DEPARTMENTS ? undefined : Number(departmentId)

  const { data: departments = [] } = useDepartments()
  const { data: payslips = [], isLoading, isError, refetch } = usePayslips(period, deptFilter)

  const generateMutation = useGeneratePayroll()
  const approveMutation = useApprovePayslip()
  const emailMutation = useSendPayslipEmail()

  const handleGenerate = async (): Promise<void> => {
    try {
      await generateMutation.mutateAsync({ period, departmentId: deptFilter, standardWorkingDays: standardDays })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Tính lương thất bại.')
    }
  }

  const handleApprove = async (id: number): Promise<void> => {
    if (!window.confirm('Duyệt phiếu lương này?')) return
    try {
      await approveMutation.mutateAsync(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Duyệt phiếu lương thất bại.')
    }
  }

  const handleEmail = async (id: number): Promise<void> => {
    try {
      await emailMutation.mutateAsync(id)
      alert('Đã gửi phiếu lương qua email.')
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gửi email thất bại.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tiền lương</h1>
        <p className="text-sm text-muted-foreground">
          Tổng hợp bảng công + OT đã duyệt và tính lương tháng (thuế TNCN lũy tiến).
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label>Kỳ lương</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label>Phòng ban</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>Tất cả phòng ban</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ngày công chuẩn</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={standardDays}
              onChange={(e) => setStandardDays(e.target.valueAsNumber || 26)}
              className="w-28"
            />
          </div>
          {canEdit && (
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
              Tính lương
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={5} columns={6} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && payslips.length === 0 && (
          <EmptyState
            icon={Calculator}
            title="Chưa có phiếu lương"
            description='Chọn kỳ lương rồi bấm "Tính lương" để tổng hợp.'
          />
        )}
        {!isLoading && !isError && payslips.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Công</TableHead>
                <TableHead>Tổng thu nhập</TableHead>
                <TableHead>Thực lĩnh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.employeeName}</TableCell>
                  <TableCell className="tabular-nums">{p.workingDays}/{p.standardWorkingDays}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(p.grossSalary)}</TableCell>
                  <TableCell className="tabular-nums font-semibold">{formatMoney(p.netSalary)}</TableCell>
                  <TableCell>
                    <PayslipStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setDetail(p)} title="Xem chi tiết">
                        <Eye className="size-4" />
                      </Button>
                      {canEdit && p.status === 'Draft' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-success hover:text-success"
                          onClick={() => handleApprove(p.id)}
                          title="Duyệt"
                          disabled={approveMutation.isPending}
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEmail(p.id)}
                          title="Gửi email"
                          disabled={emailMutation.isPending}
                        >
                          <Mail className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PayslipDetailDialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)} payslip={detail} />
    </div>
  )
}
