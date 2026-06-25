import { useEffect, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import type { OvertimeFormValues } from '@/features/overtime/types'

interface ProjectOption { id: number; name: string }
interface TaskOption { id: number; title: string }

const overtimeFormSchema = z
  .object({
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    startTime: z.string().min(1, 'Vui lòng nhập giờ bắt đầu'),
    endTime: z.string().min(1, 'Vui lòng nhập giờ kết thúc'),
    reason: z.string().min(1, 'Vui lòng nhập lý do'),
    projectId: z.string(),
    taskId: z.string(),
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
  projectId: '',
  taskId: '',
}

interface OvertimeRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: OvertimeFormValues) => Promise<void>
}

export function OvertimeRequestDialog({ open, onOpenChange, onSubmit }: OvertimeRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [tasks, setTasks] = useState<TaskOption[]>([])

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const selectedProjectId = form.watch('projectId')

  useEffect(() => {
    if (!open) return
    apiClient.get<ProjectOption[]>('/projects')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }, [open])

  useEffect(() => {
    form.setValue('taskId', '')
    if (!selectedProjectId) { setTasks([]); return }
    apiClient.get<TaskOption[]>(`/tasks?projectId=${selectedProjectId}`)
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
  }, [selectedProjectId, form])

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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dự án</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dự án (không bắt buộc)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
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
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Công việc</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedProjectId || tasks.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedProjectId
                            ? 'Chọn dự án trước'
                            : tasks.length === 0
                            ? 'Không có công việc'
                            : 'Chọn công việc (không bắt buộc)'
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tasks.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.title}
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
