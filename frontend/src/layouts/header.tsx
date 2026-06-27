import { Bell, Home, Menu, PanelLeftClose, PanelLeftOpen, ListChecks, Calendar, Info, ShieldAlert, CheckCheck, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useUiStore } from '@/stores/ui-store'
import { useAuth } from '@/features/auth/context/auth-context'
import type { UserRole } from '@/features/auth/types'
import { cn } from '@/lib/utils'

import { GlobalSearch } from '@/features/search/components/global-search'
import { useNotificationsRealtime } from '@/features/notifications/hooks/use-notifications'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/features/notifications/api/notification-queries'
import type { NotificationItem } from '@/features/notifications/types'

const TYPE_ICON_MAP: Record<NotificationItem['type'], any> = {
  task: ListChecks,
  deadline: ShieldAlert,
  overdue: ShieldAlert,
  leave: Calendar,
  system: Bell,
}


const ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: 'Super Admin',
  Manager: 'Quản lý',
  Employee: 'Nhân viên',
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}

export function Header() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: notifications, isLoading } = useNotifications()
  const { mutate: markAsRead } = useMarkNotificationAsRead()
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead()

  // Bắt đầu kết nối và lắng nghe SignalR
  useNotificationsRealtime()

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const displayName = user?.fullName ?? user?.username ?? 'Người dùng'
  const roleLabel = user ? ROLE_LABELS[user.role] : ''

  const handleLogout = async (): Promise<void> => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileSidebar}
          aria-label="Mở menu điều hướng"
        >
          <Menu className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={toggleSidebar}
          aria-label="Thu gọn/mở rộng sidebar"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/wall')}
          aria-label="Tường công ty"
          title="Tường công ty"
        >
          <Home className="size-5" />
        </Button>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-xs text-foreground">Thông báo ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                >
                  <CheckCheck className="size-3.5" />
                  Đọc tất cả
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải...
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Không có thông báo nào.
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = TYPE_ICON_MAP[notification.type] || Info
                  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })

                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-3 border-b border-border last:border-b-0 cursor-pointer focus:bg-accent",
                        !notification.isRead && "bg-accent/30 font-medium"
                      )}
                      onClick={() => handleItemClick(notification)}
                    >
                      <div className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                        notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0 text-left">
                        <p className="text-xs font-semibold leading-snug truncate text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground break-words font-normal line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          {timeAgo}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-3" />
                      )}
                    </DropdownMenuItem>
                  )
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-accent">
              <Avatar className="size-8">
                <AvatarFallback>{initialsOf(displayName)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm sm:block">
                <div className="font-medium leading-tight">{displayName}</div>
                <div className="text-xs text-muted-foreground leading-tight">{roleLabel}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email ?? 'Tài khoản'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>Hồ sơ cá nhân</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/account')}>Tài khoản</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
