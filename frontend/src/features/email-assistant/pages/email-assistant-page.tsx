import React, { useEffect, useState, useRef } from 'react'
import {
  Bot,
  Mail,
  Send,
  Settings,
  Key,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  PlusCircle,
  Sparkles,
  Building
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/features/auth/context/auth-context'
import { emailAssistantApi } from '../api/email-assistant-api'
import type { UserEmailConfig, EmailMessage, ChatMessage } from '../types'

export function EmailAssistantPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // States
  const [config, setConfig] = useState<UserEmailConfig | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [providerType, setProviderType] = useState<'Gmail' | 'ImapSmtp'>('ImapSmtp')
  
  // IMAP/SMTP fields
  const [emailAddress, setEmailAddress] = useState('')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState(993)
  const [imapUsername, setImapUsername] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [useSsl, setUseSsl] = useState(true)

  // Simplification States
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [commonPassword, setCommonPassword] = useState('')



  // Sync emailAddress changes to IMAP/SMTP usernames & auto-configure hosts for Saigon Spices domain
  useEffect(() => {
    if (providerType === 'ImapSmtp' && emailAddress) {
      setImapUsername(emailAddress)
      setSmtpUsername(emailAddress)

      if (emailAddress.endsWith('@saigonspices.com.vn')) {
        setImapHost('mail.saigonspices.com.vn')
        setImapPort(993)
        setSmtpHost('mail.saigonspices.com.vn')
        setSmtpPort(465)
        setUseSsl(true)
      }
    }
  }, [emailAddress, providerType])

  // Sync commonPassword changes to both IMAP & SMTP passwords
  const handleCommonPasswordChange = (val: string) => {
    setCommonPassword(val)
    setImapPassword(val)
    setSmtpPassword(val)
  }


  // Gmail fields
  const [gmailEmail, setGmailEmail] = useState('')
  const [gmailAccessToken, setGmailAccessToken] = useState('')
  const [gmailRefreshToken, setGmailRefreshToken] = useState('')

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Chào bạn! Tôi là **Trợ lý Email AI** của SAIGON SPICES.\n\nHãy cấu hình kết nối hòm thư ở cột bên trái, sau đó tôi có thể giúp bạn:\n- Tìm kiếm và lọc email theo tiêu chí.\n- Tóm tắt email quan trọng và trích xuất hạn chót công việc.\n- Trả lời các câu hỏi về hòm thư hoặc hỗ trợ soạn thảo thư trả lời.\n\n*Hãy gõ "Tìm email mới" để bắt đầu thử nghiệm!*'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Side email pane states
  const [matchingEmails, setMatchingEmails] = useState<EmailMessage[]>([])
  const [isLoadingEmails, setIsLoadingEmails] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const data = await emailAssistantApi.getConfig()
      if (data) {
        setConfig(data)
        setProviderType(data.provider)
        setEmailAddress(data.emailAddress)
        
        if (data.provider === 'ImapSmtp') {
          setImapHost(data.imapHost || '')
          setImapPort(data.imapPort || 993)
          setImapUsername(data.imapUsername || '')
          setSmtpHost(data.smtpHost || '')
          setSmtpPort(data.smtpPort || 465)
          setSmtpUsername(data.smtpUsername || '')
          setUseSsl(data.useSsl)
          setCommonPassword(data.hasImapPassword ? "••••••••••••" : "")

          const isDefaultSaigonSpices =
            data.imapHost === 'mail.saigonspices.com.vn' &&
            data.imapPort === 993 &&
            data.smtpHost === 'mail.saigonspices.com.vn' &&
            data.smtpPort === 465 &&
            data.imapUsername === data.emailAddress &&
            data.smtpUsername === data.emailAddress;
          setShowAdvanced(!isDefaultSaigonSpices)
        } else {
          setGmailEmail(data.emailAddress)
          setGmailAccessToken(data.gmailAccessToken || '')
        }



        // Load some emails to side-pane
        fetchRecentEmails()
      }
    } catch (err) {
      console.error('Không thể tải cấu hình email', err)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const fetchRecentEmails = async () => {
    setIsLoadingEmails(true)
    try {
      const list = await emailAssistantApi.getEmails(undefined, 5)
      setMatchingEmails(list)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingEmails(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConfig(true)
    
    let payload: Partial<UserEmailConfig> = {
      provider: providerType,
      emailAddress: providerType === 'Gmail' ? gmailEmail : emailAddress,
      useSsl
    }

    if (providerType === 'ImapSmtp') {
      payload = {
        ...payload,
        imapHost,
        imapPort,
        imapUsername,
        imapPassword: imapPassword || undefined, // Chỉ gửi nếu thay đổi
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword: smtpPassword || undefined
      }
    } else {
      payload = {
        ...payload,
        gmailAccessToken,
        gmailRefreshToken
      }
    }



    try {
      const success = await emailAssistantApi.saveConfig(payload)
      if (success) {
        toast({
          title: 'Kết nối thành công!',
          description: 'Hòm thư đã được đồng bộ với Trợ lý Email AI.',
          variant: 'default',
          className: 'bg-success text-white border-success'
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
        title: 'Lỗi cấu hình',
        description: err.message || 'Có lỗi xảy ra khi thiết lập kết nối.',
        variant: 'destructive'
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const prefillSaigonSpices = () => {
    setEmailAddress('trung.trinh@saigonspices.com.vn')
    setImapHost('mail.saigonspices.com.vn')
    setImapPort(993)
    setImapUsername('trung.trinh@saigonspices.com.vn')
    setImapPassword('SaigonSpices@2026')
    setSmtpHost('mail.saigonspices.com.vn')
    setSmtpPort(465)
    setSmtpUsername('trung.trinh@saigonspices.com.vn')
    setSmtpPassword('SaigonSpices@2026')
    setUseSsl(true)
    setProviderType('ImapSmtp')
    setCommonPassword('SaigonSpices@2026')
  }

  const prefillGmailMock = () => {
    setGmailEmail('demo.saigonspices@gmail.com')
    setGmailAccessToken('ya29.a0AfH6SMD-mock-access-token-for-dev-testing')
    setGmailRefreshToken('1//04_mock-refresh-token-for-background-sync')
    setProviderType('Gmail')
  }

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput
    if (!textToSend.trim()) return

    const newMsg: ChatMessage = { role: 'user', content: textToSend }
    const updatedMessages = [...messages, newMsg]
    
    setMessages(updatedMessages)
    setChatInput('')
    setIsSending(true)

    // Nếu người dùng gõ tìm kiếm, ta cho hiện skeleton ở bảng email
    const lowerText = textToSend.toLowerCase()
    const isSearchIntent = lowerText.includes('tìm') || lowerText.includes('lọc') || lowerText.includes('email') || lowerText.includes('thư')
    if (isSearchIntent) {
      setIsLoadingEmails(true)
    }

    try {
      const response = await emailAssistantApi.chat(updatedMessages)
      setMessages([...updatedMessages, { role: 'assistant', content: response }])
      
      // Đồng bộ lại danh sách email ở panel nếu đây là lệnh tìm kiếm
      if (isSearchIntent) {
        // Trích xuất từ khóa tìm kiếm (trong ngoặc kép hoặc toàn bộ)
        let kw = undefined
        const match = textToSend.match(/"(.*?)"/)
        if (match) kw = match[1]
        
        const list = await emailAssistantApi.getEmails(kw, 5)
        setMatchingEmails(list)
      }
    } catch (err: any) {
      toast({
        title: 'Lỗi xử lý AI',
        description: err.message || 'Không thể nhận phản hồi từ AI.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
      setIsLoadingEmails(false)
    }
  }

  const quickPrompts = [
    { label: 'Tìm email mới nhất', action: 'Tìm 5 email mới nhất' },
    { label: 'Lọc thư từ HR', action: 'Tìm các email từ "HR"' },
    { label: 'Tóm tắt email số 1', action: 'Hãy tóm tắt email số 1' },
    { label: 'Kiểm tra deadline', action: 'Tôi có những công việc hay hạn chót (deadline) nào sắp tới?' }
  ]

  if (user?.role !== 'SuperAdmin' && user?.role !== 'Manager') {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center p-4">
        <Card className="max-w-md w-full border-dashed border-destructive/30 bg-destructive/5 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto size-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive border border-destructive/20 mb-2">
              <AlertCircle className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold text-destructive">Không có quyền truy cập</CardTitle>
            <CardDescription className="text-xs">
              Trợ lý Email AI chỉ dành riêng cho Quản trị viên (Admin) và Ban giám đốc thực hiện thao tác.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-xs text-muted-foreground pb-6">
            Nếu bạn cần sử dụng tính năng này phục vụ cho công việc, vui lòng liên hệ Admin để được nâng cấp quyền hạn tài khoản.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-warning" />
            Trợ lý Email AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Trợ lý ảo tóm tắt, tìm kiếm, sắp xếp và soạn thư thông minh bảo vệ quyền riêng tư.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {config ? (
            <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/30 px-3 py-1 flex items-center gap-1.5 rounded-full">
              <CheckCircle2 className="size-3.5" />
              Đã kết nối: {config.provider === 'Gmail' ? 'Gmail' : 'mail.saigonspices.com.vn'}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1 flex items-center gap-1.5 rounded-full">
              <AlertCircle className="size-3.5" />
              Chưa cấu hình hòm thư
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        {/* Left Column: Configuration Settings (4/12 width) */}
        <Card className="lg:col-span-4 flex flex-col h-full overflow-y-auto border-sidebar-border bg-sidebar/35 shadow-sm scrollbar-thin">
          <CardHeader className="pb-3 border-b shrink-0">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="size-4.5 text-primary" />
              Kết nối hòm thư
            </CardTitle>
            <CardDescription>
              Cấu hình tài khoản email để AI có quyền đọc và tóm tắt.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4 flex-1">
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
                  <TabsList className="grid grid-cols-2 w-full p-1 bg-muted/65 rounded-lg">
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
                    </div>

                    {showAdvanced && (
                      <div className="space-y-4 pt-2 border-t border-dashed border-sidebar-border animate-in fade-in slide-in-from-top-1 duration-200">
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

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={prefillSaigonSpices}
                      className="w-full text-xs h-8 border-dashed hover:border-warning hover:text-warning"
                    >
                      <Sparkles className="size-3.5 mr-1" />
                      Điền thông tin mẫu Saigon Spices (Mock)
                    </Button>
                  </TabsContent>

                  {/* Gmail OAuth Form */}
                  <TabsContent value="Gmail" className="space-y-4 pt-4">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs leading-relaxed space-y-2">
                      <p className="font-semibold text-primary flex items-center gap-1">
                        <Key className="size-3.5" /> Tích hợp API Gmail
                      </p>
                      <p className="text-muted-foreground">
                        Đồng bộ hòm thư cá nhân qua OAuth 2.0. Yêu cầu nhập Access Token và Refresh Token để AI đọc dữ liệu thư.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gmailEmail" className="text-xs font-semibold">Địa chỉ Gmail</Label>
                      <Input
                        id="gmailEmail"
                        type="email"
                        placeholder="ten.ban@gmail.com"
                        value={gmailEmail}
                        onChange={(e) => setGmailEmail(e.target.value)}
                        required
                        className="bg-background"
                      />
                    </div>

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
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={prefillGmailMock}
                      className="w-full text-xs h-8 border-dashed hover:border-warning hover:text-warning"
                    >
                      <Sparkles className="size-3.5 mr-1" />
                      Điền thông tin Gmail mẫu (Mock)
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5 h-10"
                    disabled={isSavingConfig}
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Đang kết nối & kiểm tra...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4.5" />
                        Lưu & Kết nối hòm thư
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Split Chat Workspace & Matching Emails (8/12 width) */}
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 h-full overflow-hidden min-h-0">
          
          {/* Chat Workspace (70% or flex-1) */}
          <Card className="flex-1 flex flex-col h-full overflow-hidden shadow-sm border-sidebar-border bg-card">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center gap-3 shrink-0">
              <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <Bot className="size-5" />
              </div>
              <div className="leading-tight flex-1">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  Trợ lý Trò chuyện AI
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20 rounded-full font-medium">
                    Active
                  </Badge>
                </CardTitle>
                <CardDescription className="text-[11px] flex items-center gap-1 text-muted-foreground mt-0.5">
                  <span className="size-1.5 bg-success rounded-full inline-block animate-pulse"></span>
                  Sẵn sàng phản hồi
                </CardDescription>
              </div>
            </CardHeader>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 bg-accent/10 min-h-0 overflow-y-auto scrollbar-thin">
              <div className="space-y-4 pr-3.5">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-xs shrink-0 border select-none ${
                        m.role === 'user'
                          ? 'bg-warning/10 border-warning/20 text-warning'
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}
                    >
                      {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed border ${
                        m.role === 'user'
                          ? 'bg-warning/10 text-foreground border-warning/15 rounded-tr-none'
                          : 'bg-card text-foreground border-sidebar-border rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-line prose prose-sm dark:prose-invert">
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isSending && (
                  <div className="flex gap-3 max-w-[80%] mr-auto">
                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                      <Bot className="size-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-card border border-sidebar-border rounded-tl-none shadow-sm flex items-center gap-2">
                      <span className="size-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="size-2 bg-primary/55 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="size-2 bg-primary/75 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Prompt Suggesters */}
            <div className="px-4 py-2 border-t bg-muted/20 flex flex-wrap gap-1.5 shrink-0 select-none">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.action)}
                  disabled={isSending || !config}
                  className="text-xs bg-card hover:bg-accent border border-sidebar-border text-muted-foreground hover:text-foreground rounded-full px-3 py-1 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="size-3 text-primary" />
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <CardFooter className="p-3 border-t bg-background shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2 w-full"
              >
                <Input
                  name="chat-input-no-autofill"
                  autoComplete="off"
                  placeholder={
                    config
                      ? 'Hỏi AI tìm kiếm, tóm tắt hoặc viết email...'
                      : 'Cấu hình hòm thư trước khi bắt đầu trò chuyện'
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSending || !config}
                  className="flex-1 bg-accent/25 h-10 border-sidebar-border rounded-lg text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-10 bg-primary text-primary-foreground hover:bg-primary/95 shrink-0 rounded-lg"
                  disabled={isSending || !chatInput.trim() || !config}
                >
                  <Send className="size-4.5" />
                </Button>
              </form>
            </CardFooter>
          </Card>

          {/* Side Panel: Matches / Recent Emails (30% width) */}
          <Card className="w-full md:w-72 flex flex-col h-full overflow-hidden shadow-sm border-sidebar-border bg-sidebar/10">
            <CardHeader className="py-3 px-4 border-b shrink-0 bg-sidebar/20">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-warning" />
                Hòm thư tóm tắt
              </CardTitle>
            </CardHeader>
            
            <div className="flex-1 p-3 min-h-0 bg-background/50 overflow-y-auto scrollbar-thin">
              <div className="space-y-2">
                {isLoadingEmails ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : matchingEmails.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Mail className="size-8 text-muted-foreground/35 stroke-[1.5]" />
                    Chưa có dữ liệu email.<br />Nhập từ khóa chat để tải email.
                  </div>
                ) : (
                  matchingEmails.map((email, idx) => (
                    <div
                      key={email.messageId}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedEmail?.messageId === email.messageId
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-card border-sidebar-border hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-warning select-none">
                          {idx + 1}️⃣ Email
                        </span>
                        {email.date && (
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {new Date(email.date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold line-clamp-1 mt-1 text-foreground">
                        {email.subject}
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        Từ: {email.from}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mt-1 italic border-t pt-1 border-dashed">
                        {email.snippet}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Selected Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl bg-card border-sidebar-border animate-in fade-in zoom-in duration-200">
            <CardHeader className="py-4 border-b bg-muted/15 flex flex-row justify-between items-start shrink-0">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground leading-snug">
                  <Mail className="size-4 text-warning" />
                  {selectedEmail.subject}
                </CardTitle>
                <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 mt-1.5">
                  <div><strong>Người gửi:</strong> {selectedEmail.from}</div>
                  <div><strong>Người nhận:</strong> {selectedEmail.to}</div>
                  {selectedEmail.date && (
                    <div><strong>Ngày gửi:</strong> {new Date(selectedEmail.date).toLocaleString('vi-VN')}</div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setSelectedEmail(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <div className="flex-1 p-5 min-h-0 overflow-y-auto scrollbar-thin">
              <div 
                className="text-xs leading-relaxed whitespace-pre-line text-foreground/90 font-mono bg-accent/5 p-4 rounded-lg border border-sidebar-border"
                style={{ wordBreak: 'break-word' }}
              >
                {selectedEmail.body || selectedEmail.snippet}
              </div>
            </div>
            <CardFooter className="py-3 px-4 border-t bg-muted/15 flex justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSendMessage(`Tóm tắt nội dung email: "${selectedEmail.subject}"`)
                  setSelectedEmail(null)
                }}
                className="text-xs flex items-center gap-1"
              >
                <Sparkles className="size-3.5 text-primary" />
                Yêu cầu AI tóm tắt thư này
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEmail(null)}
                className="text-xs"
              >
                Đóng
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
