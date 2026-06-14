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
import { useEmployees } from '@/features/employees/api/employee-queries'
import { useDepartments } from '@/features/departments/api/department-queries'
import type { Department, DepartmentFormValues } from '@/features/departments/types'

const ICON_OPTIONS = [
  { value: 'code', label: 'Kỹ thuật (code)' },
  { value: 'briefcase', label: 'Kinh doanh (briefcase)' },
  { value: 'users', label: 'Nhân sự (users)' },
  { value: 'calculator', label: 'Kế toán (calculator)' },
  { value: 'megaphone', label: 'Marketing (megaphone)' },
] as const

const COLOR_OPTIONS = [
  { value: 'primary', label: 'Xanh dương' },
  { value: 'success', label: 'Xanh lá' },
  { value: 'warning', label: 'Vàng' },
  { value: 'destructive', label: 'Đỏ' },
] as const

const NO_MANAGER = 'none'
const NO_PARENT = 'none'

const departmentFormSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phòng ban'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  icon: z.enum(['code', 'briefcase', 'users', 'calculator', 'megaphone']),
  colorVariant: z.enum(['primary', 'success', 'warning', 'destructive']),
  managerId: z.string(),
  parentDepartmentId: z.string(),
})

type DepartmentFormSchema = z.infer<typeof departmentFormSchema>

const DEFAULT_VALUES: DepartmentFormSchema = {
  name: '',
  description: '',
  icon: 'users',
  colorVariant: 'primary',
  managerId: '',
  parentDepartmentId: '',
}

interface DepartmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department | null
  onSubmit: (values: DepartmentFormValues) => Promise<void>
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
}: DepartmentFormDialogProps) {
  const { data: employeesPage } = useEmployees({ pageNumber: 1, pageSize: 100 })
  const employees = employeesPage?.items ?? []
  const { data: allDepartments = [] } = useDepartments()
  const topLevelDepartments = allDepartments.filter(
    (dept) => dept.parentDepartmentId === null && dept.id !== department?.id,
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<DepartmentFormSchema>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      form.reset(
        department
          ? {
              name: department.name,
              description: department.description,
              icon: department.icon,
              colorVariant: department.colorVariant,
              managerId: department.managerId ? String(department.managerId) : '',
              parentDepartmentId: department.parentDepartmentId
                ? String(department.parentDepartmentId)
                : '',
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, department, form])

  const handleSubmit = async (values: DepartmentFormSchema): Promise<void> => {
    setSubmitError(null)
    try {
      await onSubmit({
        ...values,
        managerId: values.managerId === NO_MANAGER ? '' : values.managerId,
        parentDepartmentId:
          values.parentDepartmentId && values.parentDepartmentId !== NO_PARENT
            ? Number(values.parentDepartmentId)
            : null,
      })
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Lưu thất bại, vui lòng thử lại.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}</DialogTitle>
          <DialogDescription>
            Quản lý thông tin cơ cấu phòng ban và trưởng phòng phụ trách.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phòng ban *</FormLabel>
                  <FormControl>
                    <Input placeholder="Phòng Kỹ thuật" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trưởng phòng</FormLabel>
                  <Select value={field.value || NO_MANAGER} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn trưởng phòng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_MANAGER}>Chưa phân công</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.fullName}
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
              name="parentDepartmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thuộc khối</FormLabel>
                  <Select value={field.value || NO_PARENT} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn khối" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>Không thuộc khối nào (cấp cao nhất)</SelectItem>
                      {topLevelDepartments.map((dept) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biểu tượng</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="colorVariant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Màu</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Chức năng và nhiệm vụ của phòng ban..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {department ? 'Lưu thay đổi' : 'Thêm phòng ban'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
