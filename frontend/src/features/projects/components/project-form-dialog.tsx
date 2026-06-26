import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project, ProjectFormValues } from '@/features/projects/types'

const schema = z
  .object({
    code: z.string().max(30, 'Tối đa 30 ký tự').optional(),
    name: z.string().min(1, 'Nhập tên dự án'),
    investor: z.string(),
    startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Chọn ngày kết thúc'),
    status: z.enum(['Planning', 'InProgress', 'OnHold', 'Completed', 'Overdue']),
    budget: z.coerce.number().min(0, 'Ngân sách không hợp lệ'),
    description: z.string(),
    progress: z.coerce.number().min(0).max(100),
    shippingDate: z.string().optional(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

const DEFAULT_VALUES: ProjectFormValues = {
  code: '',
  name: '',
  investor: '',
  startDate: '',
  endDate: '',
  status: 'Planning',
  budget: 0,
  description: '',
  progress: 0,
  shippingDate: '',
}

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  onSubmit: (values: ProjectFormValues) => Promise<void>
}

export function ProjectFormDialog({ open, onOpenChange, project, onSubmit }: ProjectFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<z.input<typeof schema>, unknown, ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      form.reset(
        project
          ? {
              code: project.code,
              name: project.name,
              investor: project.investor,
              startDate: project.startDate,
              endDate: project.endDate,
              status: project.status,
              budget: project.budget,
              description: project.description,
              progress: project.progress,
              shippingDate: project.shippingDate ?? '',
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, project, form])

  const handleSubmit = async (values: ProjectFormValues): Promise<void> => {
    setSubmitError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Lưu thất bại.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? 'Cập nhật dự án' : 'Tạo dự án mới'}</DialogTitle>
          <DialogDescription>Thông tin tổng quan và tiến độ dự án.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Số hợp đồng</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={project ? undefined : "Để trống để tự động tạo"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên dự án *</FormLabel>
                  <FormControl><Input placeholder="Hệ thống..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="investor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Chủ đầu tư</FormLabel>
                  <FormControl><Input placeholder="Công ty..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Planning">Lập kế hoạch</SelectItem>
                      <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                      <SelectItem value="OnHold">Tạm dừng</SelectItem>
                      <SelectItem value="Completed">Hoàn thành</SelectItem>
                      <SelectItem value="Overdue">Quá hạn</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày bắt đầu *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày kết thúc *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngân sách (VND)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value as number} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="progress" render={({ field }) => (
                <FormItem>
                  <FormLabel>% tiến độ</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} {...field} value={field.value as number} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shippingDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <span className="inline-flex size-2 rounded-full bg-orange-500" />
                    Ngày xuất hàng
                  </FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl><Textarea placeholder="Mục tiêu, phạm vi dự án..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {project ? 'Lưu thay đổi' : 'Tạo dự án'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
