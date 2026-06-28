import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { KeyRound, Shield, User, Mail, Loader2, Lock, Eye, EyeOff, Building, CheckCircle2, AlertCircle, RefreshCw, Power } from 'lucide-react'

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
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/context/auth-context'
import { changePassword } from '@/features/auth/api/auth-api'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { emailAssistantApi } from '@/features/email-assistant/api/email-assistant-api'

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

          {/* Mailbox Connection for authorized roles */}
          {(user.role === 'SuperAdmin' || user.role === 'Manager') && (
            <MailboxConfigCard />
          )}
        </div>
      </div>
    </div>
  )
}

function MailboxConfigCard() {
  const { toast } = useToast()
  const [providerType, setProviderType] = useState<'Gmail' | 'ImapSmtp'>('ImapSmtp')
  const [emailAddress, setEmailAddress] = useState('')
  const [commonPassword, setCommonPassword] = useState('')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState(993)
  const [imapUsername, setImapUsername] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [useSsl, setUseSsl] = useState(true)
  const [gmailAccessToken, setGmailAccessToken] = useState('')
  const [gmailRefreshToken, setGmailRefreshToken] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [config, setConfig] = useState<any | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  const loadConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const data = await emailAssistantApi.getConfig()
      if (data) {
        setConfig(data)
        setProviderType(data.provider)
        if (data.provider === 'Gmail') {
          setGmailAccessToken(data.gmailAccessToken || '')
          setGmailRefreshToken(data.hasGmailRefreshToken ? '••••••••••••' : '')
          setEmailAddress('')
        } else {
          setEmailAddress(data.emailAddress)
          setImapHost(data.imapHost || '')
          setImapPort(data.imapPort || 993)
          setImapUsername(data.imapUsername || '')
          setSmtpHost(data.smtpHost || '')
          setSmtpPort(data.smtpPort || 465)
          setSmtpUsername(data.smtpUsername || '')
          setUseSsl(data.useSsl)
          setCommonPassword(data.hasImapPassword ? '••••••••••••' : '')
          setImapPassword('')
          setSmtpPassword('')
        }
      } else {
        setConfig(null)
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingConfig(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleCommonPasswordChange = (val: string) => {
    setCommonPassword(val)
    setImapPassword(val)
    setSmtpPassword(val)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConfig(true)

    let payload: any = {
      provider: providerType,
      emailAddress: providerType === 'Gmail' ? '' : emailAddress,
      useSsl
    }

    if (providerType === 'Gmail') {
      payload = {
        ...payload,
        gmailAccessToken,
        gmailRefreshToken: gmailRefreshToken && gmailRefreshToken !== '••••••••••••' ? gmailRefreshToken : undefined
      }
    } else {
      payload = {
        ...payload,
        imapHost,
        imapPort,
        imapUsername,
        imapPassword: imapPassword || undefined,
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword: smtpPassword || undefined
      }
    }

    try {
      const success = await emailAssistantApi.saveConfig(payload)
      if (success) {
        toast({
          title: 'Kết nối thành công!',
          description: 'Hòm thư đã được đồng bộ với Trợ lý Email AI.',
          variant: 'default',
        })
        loadConfig()
      } else {
        toast({
          title: 'Kết nối thất bại',
          description: 'Không thể kết nối đến hòm thư. Vui lòng kiểm tra lại cấu hình.',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi cấu hình hòm thư',
        description: err.message || 'Có lỗi xảy ra khi lưu cấu hình.',
        variant: 'destructive'
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối hòm thư này khỏi hệ thống? Trợ lý AI sẽ không thể truy cập email của bạn nữa.')) {
      return
    }
    setIsSavingConfig(true)
    try {
      const success = await emailAssistantApi.disconnectConfig()
      if (success) {
        toast({
          title: 'Đã ngắt kết nối',
          description: 'Đã hủy cấu hình hòm thư thành công.',
          variant: 'default',
        })
        // Reset states
        setEmailAddress('')
        setCommonPassword('')
        setImapHost('')
        setImapUsername('')
        setSmtpHost('')
        setSmtpUsername('')
        setGmailAccessToken('')
        setGmailRefreshToken('')
        setConfig(null)
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Không thể ngắt kết nối hòm thư.',
        variant: 'destructive'
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const prefillSaigonSpices = () => {
    setEmailAddress('factory@saigonspices.com.vn')
    setImapHost('mail.saigonspices.com.vn')
    setImapPort(993)
    setImapUsername('factory@saigonspices.com.vn')
    setImapPassword('Spices@2025Secure')
    setSmtpHost('mail.saigonspices.com.vn')
    setSmtpPort(465)
    setSmtpUsername('factory@saigonspices.com.vn')
    setSmtpPassword('Spices@2025Secure')
    setUseSsl(true)
    setProviderType('ImapSmtp')
    setCommonPassword('Spices@2025Secure')
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building className="size-4.5 text-blue-500" />
            Kết nối hòm thư công việc (Email Assistant)
          </CardTitle>
          <CardDescription>
            Liên kết hòm thư của bạn để Trợ lý Email AI có quyền truy cập, đọc và hỗ trợ tóm tắt thư.
          </CardDescription>
        </div>
        <div>
          {config ? (
            <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/30 px-2 py-0.5 flex items-center gap-1 text-[10px] rounded-full">
              <CheckCircle2 className="size-3" />
              Đã kết nối
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-2 py-0.5 flex items-center gap-1 text-[10px] rounded-full">
              <AlertCircle className="size-3" />
              Chưa kết nối
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-5">
        {isLoadingConfig ? (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-5">
            <Tabs value={providerType} onValueChange={(v) => setProviderType(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full p-1 bg-muted/65 rounded-lg max-w-sm">
                <TabsTrigger value="ImapSmtp" className="text-xs rounded-md">
                  <Building className="size-3.5 mr-1.5" />
                  Saigon Spices Mail
                </TabsTrigger>
                <TabsTrigger value="Gmail" className="text-xs rounded-md">
                  <Mail className="size-3.5 mr-1.5" />
                  Gmail Cá nhân
                </TabsTrigger>
              </TabsList>

              {/* IMAP/SMTP Form */}
              <TabsContent value="ImapSmtp" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="emailAddress" className="text-xs font-semibold">Địa chỉ Email</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="ten.nhanvien@saigonspices.com.vn"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="commonPassword" className="text-xs font-semibold">
                    Mật khẩu email công việc {(config?.hasImapPassword || config?.hasSmtpPassword) && <span className="text-success text-[10px]">(Đã lưu)</span>}
                  </Label>
                  <Input
                    id="commonPassword"
                    type="password"
                    placeholder={(config?.hasImapPassword || config?.hasSmtpPassword) ? "••••••••••••" : "Nhập mật khẩu email"}
                    value={commonPassword}
                    onChange={(e) => handleCommonPasswordChange(e.target.value)}
                    required={!(config?.hasImapPassword || config?.hasSmtpPassword)}
                    className="bg-background text-xs"
                    autoComplete="new-password"
                  />
                  <p className="text-[10px] text-muted-foreground">Chỉ cần nhập email và mật khẩu. Các thông số máy chủ sẽ được tự động cấu hình.</p>
                </div>

                <div className="flex items-center justify-between pt-1 select-none">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    {showAdvanced ? '✕ Ẩn thiết lập nâng cao' : '⚙️ Hiện thiết lập nâng cao'}
                  </button>
                  
                  {!config && (
                    <button
                      type="button"
                      onClick={prefillSaigonSpices}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline font-medium"
                    >
                      Điền nhanh Saigon Spices Mail (Demo)
                    </button>
                  )}
                </div>

                {showAdvanced && (
                  <div className="space-y-4 pt-2 border-t border-dashed animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="imapHost" className="text-xs font-semibold">Máy chủ IMAP (Nhận thư)</Label>
                        <Input
                          id="imapHost"
                          placeholder="mail.saigonspices.com.vn"
                          value={imapHost}
                          onChange={(e) => setImapHost(e.target.value)}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="imapPort" className="text-xs font-semibold">Cổng IMAP</Label>
                        <Input
                          id="imapPort"
                          type="number"
                          value={imapPort}
                          onChange={(e) => setImapPort(parseInt(e.target.value))}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="imapUsername" className="text-xs font-semibold">Tên đăng nhập IMAP</Label>
                        <Input
                          id="imapUsername"
                          value={imapUsername}
                          onChange={(e) => setImapUsername(e.target.value)}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="imapPassword" className="text-xs font-semibold">
                          Mật khẩu IMAP chuyên biệt
                        </Label>
                        <Input
                          id="imapPassword"
                          type="password"
                          placeholder="Nhập nếu khác mật khẩu chính"
                          value={imapPassword}
                          onChange={(e) => setImapPassword(e.target.value)}
                          className="bg-background text-xs"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="smtpHost" className="text-xs font-semibold">Máy chủ SMTP (Gửi thư)</Label>
                        <Input
                          id="smtpHost"
                          placeholder="mail.saigonspices.com.vn"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpPort" className="text-xs font-semibold">Cổng SMTP</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpUsername" className="text-xs font-semibold">Tên đăng nhập SMTP</Label>
                        <Input
                          id="smtpUsername"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                          required
                          className="bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpPassword" className="text-xs font-semibold">
                          Mật khẩu SMTP chuyên biệt
                        </Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          placeholder="Nhập nếu khác mật khẩu chính"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          className="bg-background text-xs"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-accent/35 mt-1 border">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold flex items-center gap-1">
                          Sử dụng SSL / TLS
                        </Label>
                        <p className="text-[10px] text-muted-foreground">Khuyên dùng bảo mật đường truyền.</p>
                      </div>
                      <Switch checked={useSsl} onCheckedChange={setUseSsl} />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* GMAIL Form */}
              <TabsContent value="Gmail" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gmailAccessToken" className="text-xs font-semibold">OAuth Access Token</Label>
                  <Input
                    id="gmailAccessToken"
                    type="password"
                    placeholder="ya29.a0AfH6SMD..."
                    value={gmailAccessToken}
                    onChange={(e) => setGmailAccessToken(e.target.value)}
                    required
                    className="bg-background text-xs"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gmailRefreshToken" className="text-xs font-semibold">
                    OAuth Refresh Token {config?.hasGmailRefreshToken && <span className="text-success text-[10px]">(Đã lưu)</span>}
                  </Label>
                  <Input
                    id="gmailRefreshToken"
                    type="password"
                    placeholder={config?.hasGmailRefreshToken ? "••••••••••••" : "Nhập Refresh Token"}
                    value={gmailRefreshToken}
                    onChange={(e) => setGmailRefreshToken(e.target.value)}
                    required={!config?.hasGmailRefreshToken}
                    className="bg-background text-xs"
                    autoComplete="new-password"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
              {config ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isSavingConfig}
                >
                  <Power className="mr-1.5 size-3.5" />
                  Ngắt kết nối hòm thư
                </Button>
              ) : (
                <div />
              )}
              
              <Button type="submit" size="sm" disabled={isSavingConfig}>
                {isSavingConfig && <RefreshCw className="mr-1.5 size-3.5 animate-spin" />}
                Lưu cấu hình & Kết nối
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
