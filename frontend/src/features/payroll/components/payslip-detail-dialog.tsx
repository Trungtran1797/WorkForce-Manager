import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PayslipStatusBadge } from '@/components/common/status-badge'
import { formatMoney } from '@/lib/formatters'
import type { Payslip } from '@/features/payroll/types'

interface PayslipDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payslip: Payslip | null
}

export function PayslipDetailDialog({ open, onOpenChange, payslip }: PayslipDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phiếu lương — {payslip?.period}</DialogTitle>
          <DialogDescription>{payslip?.employeeName}</DialogDescription>
        </DialogHeader>

        {payslip && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Ngày công: {payslip.workingDays}/{payslip.standardWorkingDays} · OT: {payslip.overtimeHours}h
              </span>
              <PayslipStatusBadge status={payslip.status} />
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {payslip.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{item.label}</span>
                  <span className={item.isEarning ? 'text-success' : 'text-destructive'}>
                    {item.isEarning ? '+' : '-'} {formatMoney(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5">
              <span className="font-semibold">Thực lĩnh</span>
              <span className="text-lg font-bold text-primary">{formatMoney(payslip.netSalary)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Tổng thu nhập: {formatMoney(payslip.grossSalary)}</span>
              <span>Thu nhập chịu thuế: {formatMoney(payslip.taxableIncome)}</span>
              <span>Bảo hiểm: {formatMoney(payslip.insurance)}</span>
              <span>Thuế TNCN: {formatMoney(payslip.personalIncomeTax)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
