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
import type { SalaryConfig, SalaryConfigFormValues } from '@/features/salary-configs/types'

const schema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  baseSalary: z.number().min(0),
  allowance: z.number().min(0),
  insuranceSalary: z.number().min(0),
  dependentCount: z.number().min(0).max(20),
})

const DEFAULT_VALUES: SalaryConfigFormValues = {
  employeeId: '',
  baseSalary: 0,
  allowance: 0,
  insuranceSalary: 0,
  dependentCount: 0,
}

const numberField = (field: { value: number; onChange: (v: number) => void }) => ({
  type: 'number' as const,
  min: 0,
  value: field.value,
  onChange: (e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.valueAsNumber || 0),
})

interface SalaryConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: SalaryConfig | null
  onSubmit: (values: SalaryConfigFormValues) => Promise<void>
}

export function SalaryConfigDialog({ open, onOpenChange, config, onSubmit }: SalaryConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: employeePage } = useEmployees({ pageNumber: 1, pageSize: 200 })
  const form = useForm<SalaryConfigFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (open) {
      form.reset(
        config
          ? {
              employeeId: String(config.employeeId),
              baseSalary: config.baseSalary,
              allowance: config.allowance,
              insuranceSalary: config.insuranceSalary,
              dependentCount: config.dependentCount,
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, config, form])

  const handleSubmit = async (values: SalaryConfigFormValues): Promise<void> => {
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
          <DialogTitle>{config ? 'Cập nhật cấu hình lương' : 'Thêm cấu hình lương'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!config}>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lương cơ bản</FormLabel>
                    <FormControl>
                      <Input {...numberField(field)} />
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
                      <Input {...numberField(field)} />
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
                      <Input {...numberField(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dependentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người phụ thuộc</FormLabel>
                    <FormControl>
                      <Input {...numberField(field)} max={20} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
