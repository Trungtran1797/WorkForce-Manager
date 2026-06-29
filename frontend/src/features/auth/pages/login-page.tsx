import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  AlertCircle,
  BarChart3,
  CheckSquare2,
  Flame,
  HelpCircle,
  Loader2,
  Lock,
  LogIn,
  User,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/features/auth/context/auth-context'

const loginSchema = z.object({
  userNameOrEmail: z.string().min(1, 'Vui lòng nhập tài khoản'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LocationState {
  from?: { pathname?: string }
}

const FEATURES = [
  { icon: Users, text: 'Quản lý nhân sự & phòng ban' },
  { icon: BarChart3, text: 'Theo dõi tiến độ dự án' },
  { icon: CheckSquare2, text: 'Phân tích KPI & hiệu suất' },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userNameOrEmail: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await login(values)
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Đăng nhập thất bại, vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-amber-100 to-orange-200" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/50 via-transparent to-sky-900/30" />
      {/* Decorative sun glow */}
      <div className="absolute bottom-0 left-1/2 h-96 w-[120%] -translate-x-1/2 rounded-full bg-orange-400/20 blur-3xl" />

      {/* Top-right utility bar */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          <span>🇻🇳</span>
          <span>Việt Nam</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          <HelpCircle className="size-3" />
          <span>Trợ giúp</span>
        </div>
      </div>

      {/* Floating card */}
      <div className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
        {/* Brand panel */}
        <div className="relative hidden w-5/12 flex-col overflow-hidden bg-gradient-to-br from-orange-950 via-orange-900 to-amber-900 p-8 sm:flex">
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-amber-500/20 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col">
            {/* Company logo */}
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-orange-400" />
              <span className="text-sm font-black tracking-widest text-orange-300 uppercase">
                Saigon Spices
              </span>
            </div>
            <div className="mb-5 mt-2 h-px w-10 bg-orange-500/40" />

            {/* App name */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                <div className="size-1.5 rounded-full bg-orange-400" />
                <span className="text-xs font-medium text-orange-200">Hệ thống nội bộ</span>
              </div>
              <h2 className="mb-1.5 text-3xl font-bold leading-tight text-white">
                WorkForce
                <br />
                Manager
              </h2>
              <p className="mb-6 text-xs leading-relaxed text-orange-200/60">
                Hệ thống quản lý nhân sự &amp; tiến độ dự án
              </p>

              <div className="space-y-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="size-3.5 text-orange-300" />
                    </div>
                    <span className="text-xs text-orange-100/75">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-orange-300/35">saigonspices.com.vn</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 flex-col items-center justify-center bg-card px-8 py-10 sm:px-10">
          <div className="w-full max-w-xs space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
                W
              </div>
              <h1 className="text-xl font-bold text-foreground">Chào mừng trở lại</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Đăng nhập vào WorkForce Manager
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="userNameOrEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Tài khoản</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="admin"
                            className="pl-8 text-sm"
                            autoComplete="username"
                            {...field}
                          />
                        </div>
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
                      <FormLabel className="text-xs">Mật khẩu</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-8 text-sm"
                            autoComplete="current-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="size-3.5" />
                      Đăng nhập
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="absolute bottom-4 z-10 text-xs text-white/50">
        Copyright © 2024 – 2026 SAIGON SPICES JSC
      </p>
    </div>
  )
}
