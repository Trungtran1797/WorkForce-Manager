import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useEmployees } from '@/features/employees/api/employee-queries'
import { useProjects } from '@/features/projects/api/project-queries'
import { useTasks } from '@/features/tasks/api/task-queries'
import type { Employee } from '@/features/employees/types'
import type { Task, TaskFormValues } from '@/features/tasks/types'

const NONE = 'none'

const schema = z.object({
  code: z.string().optional(),
  title: z.string().min(1, 'Nhập tên công việc'),
  description: z.string(),
  assigneeIds: z.array(z.number()),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  status: z.enum(['Todo', 'InProgress', 'Review', 'Done', 'Cancelled']),
  startDate: z.string(),
  dueDate: z.string(),
  progress: z.coerce.number().min(0).max(100),
  projectId: z.string(),
  parentTaskId: z.string(),
})

const DEFAULT_VALUES: z.input<typeof schema> = {
  code: '',
  title: '',
  description: '',
  assigneeIds: [],
  priority: 'Medium',
  status: 'Todo',
  startDate: '',
  dueDate: '',
  progress: 0,
  projectId: '',
  parentTaskId: '',
}

/* ─── Inline multi-select component ─── */
interface MultiAssigneeSelectProps {
  employees: Employee[]
  value: number[]
  onChange: (ids: number[]) => void
}

function MultiAssigneeSelect({ employees, value, onChange }: MultiAssigneeSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? employees.filter((e) => e.fullName.toLowerCase().includes(q)) : employees
  }, [employees, search])

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const selected = employees.filter((e) => value.includes(e.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Chưa phân công</span>
          ) : (
            selected.map((e) => (
              <Badge key={e.id} variant="secondary" className="gap-1 pr-1 text-xs">
                {e.fullName}
                <button
                  type="button"
                  onClick={(ev) => { ev.stopPropagation(); toggle(e.id) }}
                  className="ml-0.5 rounded-sm hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="flex items-center gap-1.5 border-b px-2 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy</div>
            ) : (
              filtered.map((emp) => {
                const checked = value.includes(emp.id)
                return (
                  <label
                    key={emp.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(emp.id)} />
                    <span className="flex-1">{emp.fullName}</span>
                    <span className="text-xs text-muted-foreground">{emp.departmentName}</span>
                    {checked && <Check className="size-3.5 text-primary" />}
                  </label>
                )
              })
            )}
          </div>
          {value.length > 0 && (
            <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
              Đã chọn {value.length} người
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultProjectId?: number
  onSubmit: (values: TaskFormValues) => Promise<void>
}

export function TaskFormDialog({ open, onOpenChange, task, defaultProjectId, onSubmit }: TaskFormDialogProps) {
  const { data: employeesPage } = useEmployees({ pageNumber: 1, pageSize: 100 })
  const { data: projects = [] } = useProjects()
  const employees = employeesPage?.items ?? []
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  const selectedProjectId = form.watch('projectId')
  const projectIdNumber = selectedProjectId && selectedProjectId !== NONE ? Number(selectedProjectId) : undefined

  const { data: projectTasks = [] } = useTasks(
    projectIdNumber ? { projectId: projectIdNumber } : {},
  )

  const parentTaskOptions = projectIdNumber
    ? projectTasks.filter((item) => item.parentTaskId === null && item.id !== task?.id)
    : []

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      form.reset(
        task
          ? {
              code: task.code,
              title: task.title,
              description: task.description,
              assigneeIds: task.assignees?.length
                ? task.assignees.map((a) => a.employeeId)
                : task.assigneeId
                ? [task.assigneeId]
                : [],
              priority: task.priority,
              status: task.status,
              startDate: task.startDate,
              dueDate: task.dueDate,
              progress: task.progress,
              projectId: task.projectId ? String(task.projectId) : '',
              parentTaskId: task.parentTaskId ? String(task.parentTaskId) : '',
            }
          : { ...DEFAULT_VALUES, projectId: defaultProjectId ? String(defaultProjectId) : '' },
      )
    }
  }, [open, task, defaultProjectId, form])

  const handleSubmit = async (values: any): Promise<void> => {
    setSubmitError(null)
    try {
      const parentTaskIdParsed = values.parentTaskId && values.parentTaskId !== NONE
        ? Number(values.parentTaskId)
        : null

      await onSubmit({
        ...values,
        assigneeId: values.assigneeIds[0] ? String(values.assigneeIds[0]) : '',
        parentTaskId: parentTaskIdParsed,
        projectId: values.projectId === NONE ? '' : values.projectId,
      } as unknown as TaskFormValues)
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Lưu thất bại.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Cập nhật công việc' : 'Thêm công việc mới'}</DialogTitle>
          <DialogDescription>Thông tin công việc và phân công thực hiện.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã công việc</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={task ? undefined : "(Tự động tạo)"} 
                      disabled 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên công việc *</FormLabel>
                  <FormControl><Input placeholder="Thiết kế..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl><Textarea placeholder="Chi tiết công việc..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dự án</FormLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('parentTaskId', '')
                    }}
                  >
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Chọn dự án" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Không thuộc dự án</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.code} - {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="parentTaskId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Công việc cha</FormLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={field.onChange}
                    disabled={!projectIdNumber}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={projectIdNumber ? 'Chọn công việc cha' : 'Chọn dự án trước'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— Không có (công việc độc lập) —</SelectItem>
                      {parentTaskOptions.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.code} - {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!projectIdNumber && (
                    <p className="text-xs text-muted-foreground">
                      Chọn dự án để gán công việc này thành công việc con.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="assigneeIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Người thực hiện</FormLabel>
                  <FormControl>
                    <MultiAssigneeSelect
                      employees={employees}
                      value={field.value as number[]}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Độ ưu tiên</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Thấp</SelectItem>
                      <SelectItem value="Medium">Trung bình</SelectItem>
                      <SelectItem value="High">Cao</SelectItem>
                      <SelectItem value="Urgent">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Todo">Cần làm</SelectItem>
                      <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                      <SelectItem value="Review">Chờ nghiệm thu</SelectItem>
                      <SelectItem value="Done">Hoàn thành</SelectItem>
                      <SelectItem value="Cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày bắt đầu</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạn hoàn thành</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="progress" render={({ field }) => (
                <FormItem>
                  <FormLabel>% hoàn thành</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} {...field} value={field.value as number} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {task ? 'Lưu thay đổi' : 'Thêm công việc'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
