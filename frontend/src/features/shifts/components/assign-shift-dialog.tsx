import { useEffect, useState } from 'react'
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
import { useShifts } from '@/features/shifts/api/shift-queries'
import type { AssignShiftValues } from '@/features/shifts/types'

const assignSchema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  shiftId: z.string().min(1, 'Vui lòng chọn ca'),
  workDate: z.string().min(1, 'Vui lòng chọn ngày'),
  note: z.string().optional(),
})

interface AssignShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: string
  onSubmit: (values: AssignShiftValues) => Promise<void>
}

export function AssignShiftDialog({ open, onOpenChange, defaultDate, onSubmit }: AssignShiftDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: employeePage } = useEmployees({ pageNumber: 1, pageSize: 200 })
  const { data: shifts = [] } = useShifts()

  const form = useForm<AssignShiftValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { employeeId: '', shiftId: '', workDate: defaultDate, note: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ employeeId: '', shiftId: '', workDate: defaultDate, note: '' })
    }
  }, [open, defaultDate, form])

  const handleSubmit = async (values: AssignShiftValues): Promise<void> => {
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
  const activeShifts = shifts.filter((s) => s.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân ca cho nhân viên</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                          {emp.fullName} ({emp.employeeCode})
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
              name="shiftId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ca làm việc *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn ca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeShifts.map((shift) => (
                        <SelectItem key={shift.id} value={String(shift.id)}>
                          {shift.name} ({shift.startTime}–{shift.endTime})
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
              name="workDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày làm việc *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                  'Phân ca'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
