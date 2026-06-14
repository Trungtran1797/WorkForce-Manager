import { useEffect, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmployees } from '@/features/employees/api/employee-queries'
import type { Contract, ContractFormValues } from '@/features/contracts/types'

const schema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  contractCode: z.string().min(1, 'Vui lòng nhập mã hợp đồng'),
  contractType: z.enum(['Probation', 'Official', 'Appendix']),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string(),
  baseSalary: z.number().min(0),
  allowance: z.number().min(0),
  insuranceSalary: z.number().min(0),
  status: z.enum(['Active', 'Expired', 'Terminated']),
})

const DEFAULT_VALUES: ContractFormValues = {
  employeeId: '',
  contractCode: '',
  contractType: 'Official',
  startDate: '',
  endDate: '',
  baseSalary: 0,
  allowance: 0,
  insuranceSalary: 0,
  status: 'Active',
}

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: Contract | null
  onSubmit: (values: ContractFormValues) => Promise<void>
}

const moneyField = (field: { value: number; onChange: (v: number) => void }) => ({
  type: 'number' as const,
  min: 0,
  value: field.value,
  onChange: (e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.valueAsNumber || 0),
})

export function ContractFormDialog({ open, onOpenChange, contract, onSubmit }: ContractFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: employeePage } = useEmployees({ pageNumber: 1, pageSize: 200 })
  const form = useForm<ContractFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (open) {
      form.reset(
        contract
          ? {
              employeeId: String(contract.employeeId),
              contractCode: contract.contractCode,
              contractType: contract.contractType,
              startDate: contract.startDate,
              endDate: contract.endDate ?? '',
              baseSalary: contract.baseSalary,
              allowance: contract.allowance,
              insuranceSalary: contract.insuranceSalary,
              status: contract.status,
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, contract, form])

  const handleSubmit = async (values: ContractFormValues): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch {
      // Lỗi xử lý ở component cha
    } finally {
      setIsSubmitting(false)
    }
  }

  const employees = employeePage?.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contract ? 'Cập nhật hợp đồng' : 'Thêm hợp đồng'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhân viên *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã hợp đồng *</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: HD2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại HĐ *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Probation">Thử việc</SelectItem>
                        <SelectItem value="Official">Chính thức</SelectItem>
                        <SelectItem value="Appendix">Phụ lục</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Từ ngày *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đến ngày</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương cơ bản</FormLabel>
                    <FormControl>
                      <Input {...moneyField(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phụ cấp</FormLabel>
                    <FormControl>
                      <Input {...moneyField(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insuranceSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương đóng BH</FormLabel>
                    <FormControl>
                      <Input {...moneyField(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Hiệu lực</SelectItem>
                      <SelectItem value="Expired">Hết hạn</SelectItem>
                      <SelectItem value="Terminated">Chấm dứt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
