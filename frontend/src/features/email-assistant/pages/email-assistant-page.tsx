import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Mail,
  Send,
  Settings,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const navigate = useNavigate()
  
  // States
  const [config, setConfig] = useState<UserEmailConfig | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Chào bạn! Tôi là **Trợ lý Email AI** của SAIGON SPICES.\n\nHãy đặt câu hỏi về hòm thư của bạn để tôi hỗ trợ:\n- Tìm kiếm và lọc email theo tiêu chí.\n- Tóm tắt email quan trọng và trích xuất hạn chót công việc.\n- Trả lời các câu hỏi về hòm thư hoặc hỗ trợ soạn thảo thư trả lời.\n\n*Hãy gõ "Tìm email mới" để bắt đầu thử nghiệm!*'
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
        // Load recent emails
        fetchRecentEmails()
      } else {
        setConfig(null)
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
              Đã kết nối: {config.provider === 'Gmail' ? 'Gmail' : config.emailAddress}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1 flex items-center gap-1.5 rounded-full">
              <AlertCircle className="size-3.5" />
              Chưa cấu hình hòm thư
            </Badge>
          )}
        </div>
      </div>

      {isLoadingConfig ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      ) : !config ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border border-sidebar-border bg-card shadow-lg p-6 text-center space-y-4">
            <div className="mx-auto size-14 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
              <Mail className="size-7" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-bold">Chưa kết nối hòm thư công việc</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Để trò chuyện và sử dụng các tính năng thông minh của Trợ lý Email AI, vui lòng kết nối tài khoản hòm thư cá nhân của bạn trong trang thiết lập tài khoản.
              </CardDescription>
            </div>
            <div className="pt-2">
              <Button onClick={() => navigate('/account')} className="w-full flex items-center justify-center gap-1.5 font-semibold">
                <Settings className="size-4" />
                Kết nối hòm thư trong Tài khoản
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
          
          {/* Chat Workspace (8/12 width) */}
          <Card className="lg:col-span-8 flex flex-col h-full overflow-hidden shadow-sm border-sidebar-border bg-card">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <Bot className="size-5" />
                </div>
                <div className="leading-tight">
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
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/account')}
              >
                <Settings className="size-3.5" />
                Thiết lập hòm thư
              </Button>
            </CardHeader>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 bg-accent/10 min-h-0 overflow-y-auto scrollbar-thin">
              <div className="space-y-4 pr-3.5">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`size-8 rounded-full border flex items-center justify-center shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-primary/20 text-primary border-primary/10' 
                        : 'bg-card text-foreground border-sidebar-border'
                    }`}>
                      {msg.role === 'user' ? 'U' : <Bot className="size-4" />}
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card text-foreground border border-sidebar-border rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-line prose dark:prose-invert max-w-none text-xs">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isSending && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="size-8 rounded-full border bg-card text-foreground border-sidebar-border flex items-center justify-center shrink-0">
                      <Bot className="size-4" />
                    </div>
                    <div className="bg-card text-foreground border border-sidebar-border rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm flex items-center gap-1.5">
                      <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce duration-300"></span>
                      <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce duration-300 [animation-delay:0.15s]"></span>
                      <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce duration-300 [animation-delay:0.3s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Actions & Input Form */}
            <div className="p-4 border-t bg-card shrink-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p.action)}
                    disabled={isSending}
                    className="text-[10px] font-medium bg-muted/65 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full border border-sidebar-border/30 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Hỏi AI tìm kiếm, tóm tắt hoặc viết email..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSending}
                  className="flex-1 bg-accent/10 border-sidebar-border h-10 text-xs focus-visible:ring-1"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isSending}>
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </Card>

          {/* Right Column: Mailbox Summary / Matching Emails (4/12 width) */}
          <Card className="lg:col-span-4 flex flex-col h-full overflow-hidden shadow-sm border-sidebar-border bg-card">
            <CardHeader className="py-3 px-4 border-b shrink-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Mail className="size-4.5 text-primary" />
                Hòm thư tóm tắt
              </CardTitle>
              <CardDescription className="text-[11px]">
                Email khớp với yêu cầu hoặc mới nhận gần đây.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-y-auto scrollbar-thin min-h-0 bg-accent/5">
              {isLoadingEmails ? (
                <div className="space-y-3.5">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="border rounded-xl p-3.5 space-y-2 bg-card">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4.5 w-3/4" />
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-5/6" />
                    </div>
                  ))}
                </div>
              ) : matchingEmails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="size-12 bg-muted/40 rounded-full flex items-center justify-center text-muted-foreground/50 border border-dashed mb-2 shrink-0">
                    <Mail className="size-5.5" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Không có email nào</p>
                  <p className="text-[10px] text-muted-foreground/60 max-w-[200px] leading-relaxed mt-1">
                    Gõ yêu cầu lọc hoặc kiểm tra email mới để hiển thị danh sách tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingEmails.map((email) => (
                    <div
                      key={email.messageId}
                      onClick={() => setSelectedEmail(email)}
                      className={`border rounded-xl p-3 cursor-pointer transition-all hover:bg-muted/10 bg-card ${
                        selectedEmail?.messageId === email.messageId ? 'border-primary shadow-sm bg-primary/5' : 'border-sidebar-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold text-primary truncate max-w-[140px]">
                          {email.from}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0 font-mono">
                          {email.date ? new Date(email.date).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-foreground line-clamp-1 mb-1">
                        {email.subject || '(Không có tiêu đề)'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {email.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border-sidebar-border bg-card animate-in zoom-in-95 duration-200">
            <CardHeader className="py-4 px-6 border-b shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  Chi tiết thư
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5">
                  Đang xem email lưu trữ
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-muted-foreground hover:text-foreground font-semibold text-lg"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="flex-1 p-6 overflow-y-auto scrollbar-thin min-h-0 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border bg-accent/5 p-3.5 rounded-xl">
                <div>
                  <span className="text-muted-foreground font-medium block text-[10px]">Người gửi:</span>
                  <span className="font-bold text-foreground block mt-0.5">
                    {selectedEmail.from}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block text-[10px]">Người nhận:</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {selectedEmail.to}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block text-[10px]">Thời gian nhận:</span>
                  <span className="font-medium text-foreground block mt-0.5">
                    {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString('vi-VN') : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-muted-foreground font-medium text-[10px]">Tiêu đề:</span>
                <h3 className="text-sm font-extrabold text-foreground">
                  {selectedEmail.subject || '(Không có tiêu đề)'}
                </h3>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-muted-foreground font-medium text-[10px]">Nội dung thư:</span>
                <div className="whitespace-pre-line text-foreground/90 leading-relaxed font-sans bg-accent/5 p-4 rounded-xl max-h-[300px] overflow-y-auto border">
                  {selectedEmail.body || selectedEmail.snippet}
                </div>
              </div>
            </CardContent>

            <CardFooter className="py-3 px-6 border-t shrink-0 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedEmail(null)}>
                Đóng lại
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
