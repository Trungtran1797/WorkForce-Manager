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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDepartments } from '@/features/departments/api/department-queries'
import type { Employee, EmployeeFormValues } from '@/features/employees/types'

const employeeFormSchema = z.object({
  employeeCode: z.string().min(1, 'Vui lòng nhập mã nhân viên'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['Male', 'Female', 'Other']),
  idCardNumber: z
    .string()
    .min(9, 'CCCD phải có ít nhất 9 số')
    .max(12, 'CCCD tối đa 12 số')
    .regex(/^\d+$/, 'CCCD chỉ gồm số'),
  phoneNumber: z
    .string()
    .min(9, 'Số điện thoại không hợp lệ')
    .regex(/^\d+$/, 'Số điện thoại chỉ gồm số'),
  email: z.string().email('Email không hợp lệ'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  departmentId: z.string().min(1, 'Vui lòng chọn phòng ban'),
  position: z.string().min(1, 'Vui lòng nhập chức vụ'),
  hireDate: z.string().min(1, 'Vui lòng chọn ngày vào làm'),
  status: z.enum(['Active', 'Inactive', 'OnLeave']),
})

const DEFAULT_VALUES: EmployeeFormValues = {
  employeeCode: '',
  fullName: '',
  dateOfBirth: '',
  gender: 'Male',
  idCardNumber: '',
  phoneNumber: '',
  email: '',
  address: '',
  departmentId: '',
  position: '',
  hireDate: '',
  status: 'Active',
}

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  onSubmit: (values: EmployeeFormValues) => Promise<void>
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
}: EmployeeFormDialogProps) {
  const { data: departments = [] } = useDepartments()

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        employee
          ? {
              employeeCode: employee.employeeCode,
              fullName: employee.fullName,
              dateOfBirth: employee.dateOfBirth,
              gender: employee.gender,
              idCardNumber: employee.idCardNumber,
              phoneNumber: employee.phoneNumber,
              email: employee.email,
              address: employee.address,
              departmentId: String(employee.departmentId),
              position: employee.position,
              hireDate: employee.hireDate,
              status: employee.status,
            }
          : DEFAULT_VALUES
      )
    }
  }, [open, employee, form])

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (values: EmployeeFormValues): Promise<void> => {
    setSubmitError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Lưu thất bại, vui lòng thử lại.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
          <DialogDescription>
            Nhập đầy đủ thông tin nhân sự theo quy định. Các trường có dấu (*) là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã nhân viên *</FormLabel>
                    <FormControl>
                      <Input placeholder="NV013" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Nam</SelectItem>
                        <SelectItem value="Female">Nữ</SelectItem>
                        <SelectItem value="Other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idCardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số CCCD *</FormLabel>
                    <FormControl>
                      <Input placeholder="079092001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại *</FormLabel>
                    <FormControl>
                      <Input placeholder="0901234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ *</FormLabel>
                    <FormControl>
                      <Input placeholder="Quận 1, TP. HCM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>
                            {department.name}
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
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chức vụ *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lập trình viên" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày vào làm *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Đang làm việc</SelectItem>
                        <SelectItem value="Inactive">Đã nghỉ</SelectItem>
                        <SelectItem value="OnLeave">Đang nghỉ phép</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {employee ? 'Lưu thay đổi' : 'Thêm nhân viên'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
