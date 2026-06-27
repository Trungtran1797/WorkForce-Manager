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
import { useEmployees } from '@/features/employees/api/employee-queries'
import type { CreateUserPayload } from '@/features/users/types'

const userFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Tên đăng nhập chỉ gồm chữ, số, gạch dưới và dấu chấm'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  role: z.enum(['SuperAdmin', 'Manager', 'Employee']),
  employeeId: z.string().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

const DEFAULT_VALUES: UserFormValues = {
  username: '',
  email: '',
  password: '',
  role: 'Employee',
  employeeId: '',
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateUserPayload) => Promise<void>
}

export function UserFormDialog({ open, onOpenChange, onSubmit }: UserFormDialogProps) {
  const { data: employeesData } = useEmployees({
    pageNumber: 1,
    pageSize: 100,
    status: 'Active',
  })
  const employees = employeesData?.items ?? []

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, form])

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (values: UserFormValues): Promise<void> => {
    setSubmitError(null)
    try {
      await onSubmit({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
        employeeId: values.employeeId && values.employeeId !== 'none' ? Number(values.employeeId) : null,
      })
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Tạo tài khoản thất bại, vui lòng thử lại.')
    }
  }

  // Tự động điền email của nhân sự khi chọn
  const selectedEmployeeId = form.watch('employeeId')
  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId !== 'none') {
      const emp = employees.find((e) => String(e.id) === selectedEmployeeId)
      if (emp) {
        form.setValue('email', emp.email)
      }
    }
  }, [selectedEmployeeId, employees, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin tài khoản đăng nhập cho thành viên mới.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đăng nhập *</FormLabel>
                  <FormControl>
                    <Input placeholder="nguyenvana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu đăng nhập *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò hệ thống *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Liên kết nhân sự (Không bắt buộc)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhân viên liên kết" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Không liên kết</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          [{emp.employeeCode}] {emp.fullName}
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

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
