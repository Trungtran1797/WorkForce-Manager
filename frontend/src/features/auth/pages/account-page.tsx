import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { KeyRound, Shield, User, Mail, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/auth-context'
import { changePassword } from '@/features/auth/api/auth-api'
import { useToast } from '@/hooks/use-toast'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin (Toàn quyền)',
  Manager: 'Manager (Quản lý)',
  Employee: 'Employee (Nhân viên)',
}

export function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      setSubmitting(true)
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast({
        title: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu của bạn đã được thay đổi thành công.',
      })
      form.reset()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Đổi mật khẩu thất bại',
        description: err.message || 'Mật khẩu cũ không chính xác hoặc xảy ra lỗi hệ thống.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tài khoản</h1>
        <p className="text-sm text-muted-foreground">Quản lý bảo mật tài khoản đăng nhập và cấu hình cá nhân.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Thông tin tài khoản */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="size-4.5 text-blue-500" />
                Thông tin đăng nhập
              </CardTitle>
              <CardDescription>Thông tin định danh của tài khoản trên hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">Tên đăng nhập</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  {user.username}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">Địa chỉ Email</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {user.email}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">Vai trò hệ thống</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5 text-muted-foreground" />
                  {ROLE_LABELS[user.role] ?? user.role}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 2 & 3: Đổi mật khẩu */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <KeyRound className="size-4.5 text-blue-500" />
                Đổi mật khẩu bảo mật
              </CardTitle>
              <CardDescription>Đảm bảo sử dụng mật khẩu mạnh để bảo vệ tài khoản khỏi các truy cập trái phép.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Mật khẩu hiện tại *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type={showCurrent ? 'text' : 'password'}
                              className="pl-9 pr-10"
                              placeholder="Nhập mật khẩu hiện tại của bạn"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrent(!showCurrent)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Mật khẩu mới *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type={showNew ? 'text' : 'password'}
                              className="pl-9 pr-10"
                              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Xác nhận mật khẩu mới *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type={showConfirm ? 'text' : 'password'}
                              className="pl-9 pr-10"
                              placeholder="Xác nhận lại mật khẩu mới"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" size="sm" disabled={submitting}>
                      {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
