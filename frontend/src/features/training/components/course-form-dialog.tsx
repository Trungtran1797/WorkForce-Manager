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
import { Textarea } from '@/components/ui/textarea'
import type { CourseFormValues, TrainingCourse } from '@/features/training/types'

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên khóa học'),
  description: z.string(),
  instructor: z.string(),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string(),
})

const DEFAULT_VALUES: CourseFormValues = {
  name: '',
  description: '',
  instructor: '',
  startDate: '',
  endDate: '',
}

interface CourseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: TrainingCourse | null
  onSubmit: (values: CourseFormValues) => Promise<void>
}

export function CourseFormDialog({ open, onOpenChange, course, onSubmit }: CourseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<CourseFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (open) {
      form.reset(
        course
          ? {
              name: course.name,
              description: course.description ?? '',
              instructor: course.instructor ?? '',
              startDate: course.startDate,
              endDate: course.endDate ?? '',
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, course, form])

  const handleSubmit = async (values: CourseFormValues): Promise<void> => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? 'Cập nhật khóa đào tạo' : 'Thêm khóa đào tạo'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khóa học *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: ASP.NET Core nâng cao" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giảng viên</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Mr. A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày bắt đầu *</FormLabel>
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
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
