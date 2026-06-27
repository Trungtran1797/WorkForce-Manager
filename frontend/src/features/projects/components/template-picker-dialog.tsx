import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, Truck, Users } from 'lucide-react'

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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useProjectTemplates, useCreateProjectFromTemplate } from '@/features/projects/api/project-queries'
import { uploadProjectAttachments } from '@/features/projects/api/project-api'
import type { ProjectTemplate } from '@/features/projects/types'

// ─── Step 1: chọn template ───────────────────────────────────────────────────

interface TemplateCardProps {
  template: ProjectTemplate
  selected: boolean
  onSelect: () => void
}

function TemplateCard({ template, selected, onSelect, index }: TemplateCardProps & { index: number }) {
  const displayName = template.name.replace(/^\[MẪU\]\s*/i, '')

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:bg-muted/40',
        selected && 'border-primary bg-primary/5 ring-1 ring-primary',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs px-1.5 py-0">
              Mẫu {index + 1}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{template.code}</span>
          </div>
          <p className="font-medium leading-snug">{displayName}</p>
          {template.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
          )}
        </div>
        {selected && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {template.durationDays} ngày
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="size-3.5" />
          {template.taskCount} công việc
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          {template.departmentRoles.length} bộ phận
        </span>
      </div>

      {template.departmentRoles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {template.departmentRoles.map((role) => (
            <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
              {role}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}

// ─── Step 2: điền thông tin dự án mới ────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Nhập tên dự án'),
  investor: z.string().optional(),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Chọn ngày kết thúc'),
  shippingDate: z.string().optional(),
  budget: z.coerce.number().min(0),
  code: z.string().max(30).optional(),
})

type FormValues = z.infer<typeof schema>

interface ProjectInfoFormProps {
  template: ProjectTemplate
  onBack: () => void
  onSuccess: () => void
}

function ProjectInfoForm({ template, onBack, onSuccess }: ProjectInfoFormProps) {
  const createFromTemplate = useCreateProjectFromTemplate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const displayName = template.name.replace(/^\[MẪU\]\s*/i, '')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: displayName,
      investor: 'SAIGON SPICES',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(new Date().getTime() + template.durationDays * 86400000).toISOString().slice(0, 10),
      shippingDate: '',
      budget: 0,
      code: '',
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      const created = await createFromTemplate.mutateAsync({
        templateId: template.id,
        name: values.name,
        investor: values.investor,
        startDate: values.startDate,
        endDate: values.endDate,
        shippingDate: values.shippingDate || undefined,
        budget: values.budget,
        code: values.code || undefined,
      })
      if (selectedFiles.length > 0 && created?.id) {
        await uploadProjectAttachments(created.id, selectedFiles)
      }
      onSuccess()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Tạo dự án thất bại.')
    }
  }

  const startDate = form.watch('startDate')

  useEffect(() => {
    if (startDate) {
      const end = new Date(new Date(startDate).getTime() + template.durationDays * 86400000)
      form.setValue('endDate', end.toISOString().slice(0, 10))
    }
  }, [startDate, template.durationDays, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Mẫu: <span className="font-medium text-foreground">{displayName}</span>
          {' · '}
          <span>{template.durationDays} ngày · {template.taskCount} bước</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Số hợp đồng</FormLabel>
              <FormControl>
                <Input placeholder="Để trống để tự động tạo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Tên dự án *</FormLabel>
              <FormControl>
                <Input placeholder="Tên đơn hàng hoặc khách hàng..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="investor" render={({ field }) => (
            <FormItem>
              <FormLabel>Khách hàng / Chủ đầu tư</FormLabel>
              <FormControl>
                <Input placeholder="Tên đối tác..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem>
              <FormLabel>Giá trị hợp đồng (VND)</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày bắt đầu *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày kết thúc *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="shippingDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-orange-500" />
                Ngày xuất hàng
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="col-span-1 sm:col-span-2 space-y-2">
            <FormLabel>Tài liệu đính kèm (Hợp đồng, tài liệu kỹ thuật...)</FormLabel>
            <Input
              type="file"
              multiple
              className="cursor-pointer"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setSelectedFiles(files)
              }}
            />
            {selectedFiles.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Đã chọn {selectedFiles.length} tệp
              </div>
            )}
          </div>
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Đang tạo...' : 'Tạo dự án'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// ─── Dialog chính ─────────────────────────────────────────────────────────────

interface TemplatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatePickerDialog({ open, onOpenChange }: TemplatePickerDialogProps) {
  const { data: templates = [], isLoading } = useProjectTemplates()
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [step, setStep] = useState<'pick' | 'fill'>('pick')

  const handleClose = () => {
    onOpenChange(false)
    setSelectedTemplate(null)
    setStep('pick')
  }

  const handleNext = () => {
    if (selectedTemplate) setStep('fill')
  }

  const handleBack = () => setStep('pick')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'pick' ? 'Chọn mẫu dự án' : 'Thông tin dự án'}
          </DialogTitle>
        </DialogHeader>

        {step === 'pick' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chọn một mẫu quy trình phù hợp — các công việc và phân công nhân sự sẽ được tạo tự động.
            </p>

            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))
                : templates.length === 0
                  ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có mẫu dự án nào. Liên hệ quản trị viên để thêm.
                    </p>
                  )
                  : templates.map((t, idx) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      index={idx}
                      selected={selectedTemplate?.id === t.id}
                      onSelect={() => setSelectedTemplate(t)}
                    />
                  ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Hủy</Button>
              <Button onClick={handleNext} disabled={!selectedTemplate}>
                Tiếp theo
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'fill' && selectedTemplate && (
          <ProjectInfoForm
            template={selectedTemplate}
            onBack={handleBack}
            onSuccess={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
