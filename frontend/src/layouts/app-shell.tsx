import { Outlet } from 'react-router-dom'

import { Header } from '@/layouts/header'
import { MobileSidebar, Sidebar } from '@/layouts/sidebar'
import { EmailAssistantChatBubble } from '@/features/email-assistant/components/email-assistant-chat-bubble'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          <Outlet />
          <EmailAssistantChatBubble />
        </main>
      </div>
    </div>
  )
}
