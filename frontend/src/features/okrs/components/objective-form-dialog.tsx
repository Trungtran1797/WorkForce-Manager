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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDepartments } from '@/features/departments/api/department-queries'
import { useEmployees } from '@/features/employees/api/employee-queries'
import type { ObjectiveFormValues, OkrObjective } from '@/features/okrs/types'

const keyResultSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Bắt buộc'),
  targetValue: z.number().gt(0, 'Phải > 0'),
  currentValue: z.number().min(0),
  unit: z.string(),
  weight: z.number().gt(0, 'Phải > 0'),
})

const schema = z
  .object({
    title: z.string().min(1, 'Vui lòng nhập tên mục tiêu'),
    description: z.string(),
    ownerType: z.enum(['Department', 'Individual']),
    departmentId: z.string(),
    employeeId: z.string(),
    period: z.string().min(1, 'Vui lòng nhập kỳ (VD: 2026-Q2)'),
    status: z.enum(['Draft', 'Active', 'Achieved', 'Failed']),
    keyResults: z.array(keyResultSchema).min(1, 'Cần ít nhất 1 kết quả then chốt'),
  })
  .refine((data) => data.ownerType !== 'Department' || data.departmentId !== '', {
    message: 'Vui lòng chọn phòng ban',
    path: ['departmentId'],
  })
  .refine((data) => data.ownerType !== 'Individual' || data.employeeId !== '', {
    message: 'Vui lòng chọn nhân viên',
    path: ['employeeId'],
  })

const DEFAULT_VALUES: ObjectiveFormValues = {
  title: '',
  description: '',
  ownerType: 'Individual',
  departmentId: '',
  employeeId: '',
  period: '',
  status: 'Active',
  keyResults: [{ id: 0, title: '', targetValue: 100, currentValue: 0, unit: '%', weight: 1 }],
}

interface ObjectiveFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objective?: OkrObjective | null
  onSubmit: (values: ObjectiveFormValues) => Promise<void>
}

const numberField = (field: { value: number; onChange: (v: number) => void }) => ({
  type: 'number' as const,
  value: field.value,
  onChange: (e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.valueAsNumber || 0),
})

export function ObjectiveFormDialog({ open, onOpenChange, objective, onSubmit }: ObjectiveFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: departments = [] } = useDepartments()
  const { data: employeePage } = useEmployees({ pageNumber: 1, pageSize: 200 })
  const employees = employeePage?.items ?? []

  const form = useForm<ObjectiveFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'keyResults' })

  useEffect(() => {
    if (open) {
      form.reset(
        objective
          ? {
              title: objective.title,
              description: objective.description ?? '',
              ownerType: objective.ownerType,
              departmentId: objective.departmentId ? String(objective.departmentId) : '',
              employeeId: objective.employeeId ? String(objective.employeeId) : '',
              period: objective.period,
              status: objective.status,
              keyResults: objective.keyResults.map((kr) => ({
                id: kr.id,
                title: kr.title,
                targetValue: kr.targetValue,
                currentValue: kr.currentValue,
                unit: kr.unit ?? '',
                weight: kr.weight,
              })),
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, objective, form])

  const ownerType = form.watch('ownerType')

  const handleSubmit = async (values: ObjectiveFormValues): Promise<void> => {
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{objective ? 'Cập nhật mục tiêu (OKR)' : 'Thêm mục tiêu (OKR)'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên mục tiêu *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Tăng doanh số khu vực miền Nam" {...field} />
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="ownerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phạm vi *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Cá nhân</SelectItem>
                        <SelectItem value="Department">Phòng ban</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ownerType === 'Individual' ? (
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
                              {emp.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phòng ban *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn phòng ban" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Nháp</SelectItem>
                      <SelectItem value="Active">Đang thực hiện</SelectItem>
                      <SelectItem value="Achieved">Đạt mục tiêu</SelectItem>
                      <SelectItem value="Failed">Không đạt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Kết quả then chốt (Key Results) *</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ id: 0, title: '', targetValue: 100, currentValue: 0, unit: '%', weight: 1 })}
                >
                  <Plus className="size-3.5" />
                  Thêm KR
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.title`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="VD: Doanh số đạt được" {...f} />
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.currentValue`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Hiện tại</FormLabel>
                          <FormControl>
                            <Input {...numberField(f)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.targetValue`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mục tiêu</FormLabel>
                          <FormControl>
                            <Input {...numberField(f)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.unit`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Đơn vị</FormLabel>
                          <FormControl>
                            <Input placeholder="%, đơn, ..." {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.weight`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Trọng số</FormLabel>
                          <FormControl>
                            <Input {...numberField(f)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              {form.formState.errors.keyResults?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.keyResults.root.message}</p>
              )}
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
