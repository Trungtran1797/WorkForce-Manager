import { useEffect, useState, useRef } from 'react'
import {
  Bot,
  X,
  MessageSquare,
  Send,
  PlusCircle,
  AlertCircle,
  User
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/auth-context'
import { useToast } from '@/hooks/use-toast'
import { emailAssistantApi } from '../api/email-assistant-api'
import type { ChatMessage } from '../types'

export function EmailAssistantChatBubble() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Only show for Admin (SuperAdmin) and Board of Directors (Manager)
  if (user?.role !== 'SuperAdmin' && user?.role !== 'Manager') {
    return null
  }

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content:
        'Chào bạn! Tôi là **Trợ lý Email AI** của SAIGON SPICES.\n\nTôi có thể giúp bạn:\n- Tìm kiếm và lọc email theo tiêu chí.\n- Tóm tắt email quan trọng và trích xuất hạn chót công việc.\n- Trả lời các câu hỏi về hòm thư hoặc hỗ trợ soạn thảo thư trả lời.\n\n*Nhấn nút nhanh bên dưới hoặc gõ tin nhắn để bắt đầu!*'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [hasConfig, setHasConfig] = useState<boolean>(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Load config on open to check if mail setup exists
  useEffect(() => {
    if (isOpen) {
      checkMailConfig()
    }
  }, [isOpen])

  const checkMailConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const cfg = await emailAssistantApi.getConfig()
      setHasConfig(!!cfg)
    } catch (err) {
      console.error(err)
      setHasConfig(false)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleSendMessage = async (forcedText?: string) => {
    const textToSend = forcedText || chatInput
    if (!textToSend.trim() || isSending) return

    if (!forcedText) {
      setChatInput('')
    }

    const newMsg: ChatMessage = { role: 'user', content: textToSend }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setIsSending(true)

    try {
      const reply = await emailAssistantApi.chat(
        updatedMessages.filter((m) => m.role !== 'system')
      )
      setMessages([...updatedMessages, { role: 'assistant', content: reply }])
    } catch (err: any) {
      toast({
        title: 'Lỗi trợ lý AI',
        description: err.message || 'Không thể nhận phản hồi từ AI.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const quickPrompts = [
    { label: '5 thư mới nhất', action: 'Tìm 5 email mới nhất' },
    { label: 'Thư từ HR', action: 'Tìm các email từ "HR"' },
    { label: 'Tóm tắt thư mới', action: 'Tóm tắt email mới nhất' }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      {/* Floating Chat Window */}
      {isOpen && (
        <Card className="mb-4 w-96 h-[500px] flex flex-col shadow-2xl border-sidebar-border bg-card overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-5">
          {/* Header */}
          <CardHeader className="py-3 px-4 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <Bot className="size-4.5" />
              </div>
              <div className="leading-tight">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  Trợ lý Email AI
                  <span className="size-2 bg-success rounded-full inline-block animate-pulse"></span>
                </CardTitle>
                <CardDescription className="text-[10px] text-primary-foreground/70">
                  Tóm tắt & tìm kiếm thư thông minh
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10 size-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          {/* Conversation Screen */}
          <div className="flex-1 p-3 bg-accent/5 min-h-0 overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-[10px] shrink-0 border select-none ${
                      m.role === 'user'
                        ? 'bg-warning/10 border-warning/20 text-warning'
                        : 'bg-primary/10 border-primary/20 text-primary'
                    }`}
                  >
                    {m.role === 'user' ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                  </div>
                  <div
                    className={`p-2.5 rounded-xl shadow-sm text-xs leading-relaxed border ${
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
                <div className="flex gap-2 max-w-[80%] mr-auto">
                  <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                    <Bot className="size-3.5" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-sidebar-border rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="size-1.5 bg-primary/55 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="size-1.5 bg-primary/75 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-1.5 border-t bg-muted/20 flex flex-wrap gap-1.5 shrink-0">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.action)}
                disabled={isSending || hasConfig === false}
                className="text-[10px] bg-card hover:bg-accent border border-sidebar-border text-muted-foreground hover:text-foreground rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle className="size-2.5 text-primary" />
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <CardFooter className="p-2 border-t bg-background shrink-0">
            {hasConfig === false ? (
              <div className="w-full p-2 bg-warning/5 border border-warning/20 rounded-lg text-[11px] text-warning-foreground flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-warning shrink-0" />
                <span>Bạn cần cấu hình hòm thư trước khi dùng.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-1.5 w-full"
              >
                <Input
                  name="chat-bubble-no-autofill"
                  autoComplete="off"
                  placeholder={
                    isLoadingConfig
                      ? 'Đang kiểm tra kết nối...'
                      : 'Hỏi AI tìm kiếm hoặc viết thư...'
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSending || isLoadingConfig}
                  className="flex-1 bg-accent/25 h-8 border-sidebar-border rounded-md text-xs"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-8 bg-primary text-primary-foreground hover:bg-primary/95 shrink-0 rounded-md"
                  disabled={isSending || !chatInput.trim() || isLoadingConfig}
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Floating Chat Bubble Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="size-14 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-2xl flex items-center justify-center transform transition-transform duration-200 hover:scale-105"
      >
        {isOpen ? <X className="size-6 animate-in spin-in-90" /> : <MessageSquare className="size-6 animate-in zoom-in-50" />}
      </Button>
    </div>
  )
}
