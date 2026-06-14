import { useEffect, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'

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
import { useAuth } from '@/features/auth/context/auth-context'
import type { CreateReviewFormValues } from '@/features/performance/types'

const schema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  reviewerId: z.string().min(1, 'Vui lòng chọn người đánh giá'),
  period: z.string().min(1, 'Vui lòng nhập kỳ (VD: 2026-Q2)'),
  reviewType: z.enum(['Self', 'Manager', 'Peer']),
  criteria: z
    .array(z.object({ criterion: z.string().min(1, 'Bắt buộc'), weight: z.number().gt(0, 'Phải > 0') }))
    .min(1, 'Cần ít nhất 1 tiêu chí'),
})

const DEFAULT_CRITERIA = [
  { criterion: 'Chất lượng công việc', weight: 1 },
  { criterion: 'Tiến độ & hiệu suất', weight: 1 },
  { criterion: 'Tinh thần hợp tác', weight: 1 },
  { criterion: 'Sáng tạo & cải tiến', weight: 1 },
  { criterion: 'Tuân thủ kỷ luật', weight: 1 },
]

interface CreateReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateReviewFormValues) => Promise<void>
}

const numberField = (field: { value: number; onChange: (v: number) => void }) => ({
  type: 'number' as const,
  value: field.value,
  onChange: (e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.valueAsNumber || 0),
})

export function CreateReviewDialog({ open, onOpenChange, onSubmit }: CreateReviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { data: employeePage } = useEmployees({ pageNumber: 1, pageSize: 200 })
  const employees = employeePage?.items ?? []

  const form = useForm<CreateReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      reviewerId: '',
      period: '',
      reviewType: 'Manager',
      criteria: DEFAULT_CRITERIA,
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'criteria' })

  useEffect(() => {
    if (open) {
      form.reset({
        employeeId: '',
        reviewerId: user?.employeeId ? String(user.employeeId) : '',
        period: '',
        reviewType: 'Manager',
        criteria: DEFAULT_CRITERIA,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (values: CreateReviewFormValues): Promise<void> => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu đánh giá hiệu suất</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhân viên được đánh giá *</FormLabel>
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
                name="reviewerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người đánh giá *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn người đánh giá" />
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kỳ *</FormLabel>
                    <FormControl>
                      <Input placeholder="2026-Q2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại đánh giá *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Self">Tự đánh giá</SelectItem>
                        <SelectItem value="Manager">Quản lý đánh giá</SelectItem>
                        <SelectItem value="Peer">Đồng nghiệp đánh giá</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Tiêu chí đánh giá *</FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ criterion: '', weight: 1 })}>
                  <Plus className="size-3.5" />
                  Thêm tiêu chí
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`criteria.${index}.criterion`}
                    render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="VD: Chất lượng công việc" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`criteria.${index}.weight`}
                    render={({ field: f }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input placeholder="Trọng số" {...numberField(f)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo phiếu đánh giá'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
