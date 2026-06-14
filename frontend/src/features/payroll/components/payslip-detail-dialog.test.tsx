import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PayslipDetailDialog } from './payslip-detail-dialog'
import type { Payslip } from '@/features/payroll/types'

const samplePayslip: Payslip = {
  id: 1,
  employeeId: 1,
  employeeName: 'Nguyễn Văn A',
  period: '2026-06',
  workingDays: 26,
  standardWorkingDays: 26,
  overtimeHours: 0,
  baseSalary: 26_000_000,
  allowance: 0,
  overtimePay: 0,
  grossSalary: 26_000_000,
  insurance: 2_730_000,
  personalDeduction: 11_000_000,
  dependentDeduction: 0,
  taxableIncome: 12_270_000,
  personalIncomeTax: 840_500,
  netSalary: 22_429_500,
  status: 'Approved',
  generatedDate: '2026-06-30 09:00',
  approvedDate: '2026-06-30 10:00',
  items: [
    { label: 'Lương theo công', amount: 26_000_000, isEarning: true },
    { label: 'Thuế TNCN', amount: 840_500, isEarning: false },
  ],
}

describe('PayslipDetailDialog', () => {
  it('hiển thị thực lĩnh và các dòng chi tiết', () => {
    render(<PayslipDetailDialog open payslip={samplePayslip} onOpenChange={() => {}} />)

    expect(screen.getByText('Thực lĩnh')).toBeInTheDocument()
    expect(screen.getByText('Lương theo công')).toBeInTheDocument()
    expect(screen.getByText('Thuế TNCN')).toBeInTheDocument()
    // Thực lĩnh hiển thị định dạng VND.
    expect(screen.getByText(/22\.429\.500 đ/)).toBeInTheDocument()
  })
})
