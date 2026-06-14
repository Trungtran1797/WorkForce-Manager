import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import type { OvertimeFormValues } from '@/features/overtime/types'

const overtimeFormSchema = z
  .object({
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    startTime: z.string().min(1, 'Vui lòng nhập giờ bắt đầu'),
    endTime: z.string().min(1, 'Vui lòng nhập giờ kết thúc'),
    reason: z.string().min(1, 'Vui lòng nhập lý do'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['endTime'],
  })

const DEFAULT_VALUES: OvertimeFormValues = {
  date: '',
  startTime: '18:00',
  endTime: '20:00',
  reason: '',
}

interface OvertimeRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: OvertimeFormValues) => Promise<void>
}

export function OvertimeRequestDialog({ open, onOpenChange, onSubmit }: OvertimeRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const handleSubmit = async (values: OvertimeFormValues): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      form.reset(DEFAULT_VALUES)
      onOpenChange(false)
    } catch {
      // Lỗi xử lý ở component cha
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng ký làm thêm giờ</DialogTitle>
          <DialogDescription>
            Đơn sẽ được gửi tới Quản lý để duyệt. Giờ OT sau khi duyệt sẽ được tính vào bảng công.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày làm thêm *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ kết thúc *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập lý do làm thêm giờ..." {...field} />
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
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đơn'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
