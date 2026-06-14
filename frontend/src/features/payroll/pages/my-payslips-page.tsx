import { useState } from 'react'
import { Eye, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { PayslipDetailDialog } from '@/features/payroll/components/payslip-detail-dialog'
import { useMyPayslips } from '@/features/payroll/api/payroll-queries'
import type { Payslip } from '@/features/payroll/types'

export function MyPayslipsPage() {
  const [detail, setDetail] = useState<Payslip | null>(null)
  const { data: payslips = [], isLoading, isError, refetch } = useMyPayslips()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Phiếu lương của tôi</h1>
        <p className="text-sm text-muted-foreground">Danh sách phiếu lương đã được duyệt.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={5} columns={5} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && payslips.length === 0 && (
          <EmptyState icon={Wallet} title="Chưa có phiếu lương" description="Bạn chưa có phiếu lương nào được duyệt." />
        )}
        {!isLoading && !isError && payslips.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kỳ lương</TableHead>
                <TableHead>Công</TableHead>
                <TableHead>Tổng thu nhập</TableHead>
                <TableHead>Thực lĩnh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.period}</TableCell>
                  <TableCell className="tabular-nums">{p.workingDays}/{p.standardWorkingDays}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(p.grossSalary)}</TableCell>
                  <TableCell className="tabular-nums font-semibold">{formatMoney(p.netSalary)}</TableCell>
                  <TableCell>
                    <PayslipStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(p)}>
                      <Eye className="size-4" />
                    </Button>
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
