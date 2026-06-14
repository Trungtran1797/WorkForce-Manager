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
import type { CompleteTrainingFormValues, TrainingEnrollment } from '@/features/training/types'

const schema = z.object({
  status: z.enum(['Enrolled', 'Completed', 'Cancelled']),
  certificateCode: z.string(),
})

interface CompleteTrainingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment: TrainingEnrollment | null
  onSubmit: (enrollmentId: number, values: CompleteTrainingFormValues) => Promise<void>
}

export function CompleteTrainingDialog({ open, onOpenChange, enrollment, onSubmit }: CompleteTrainingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<CompleteTrainingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Completed', certificateCode: '' },
  })

  useEffect(() => {
    if (open && enrollment) {
      form.reset({ status: enrollment.status, certificateCode: enrollment.certificateCode ?? '' })
    }
  }, [open, enrollment, form])

  if (!enrollment) return null

  const handleSubmit = async (values: CompleteTrainingFormValues): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(enrollment.id, values)
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
          <DialogTitle>Cập nhật trạng thái đào tạo - {enrollment.employeeName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <SelectItem value="Enrolled">Đang học</SelectItem>
                      <SelectItem value="Completed">Hoàn thành</SelectItem>
                      <SelectItem value="Cancelled">Đã huỷ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificateCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã chứng chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: CERT-2026-001" {...field} />
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
