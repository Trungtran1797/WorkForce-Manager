import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bell, CalendarOff, CheckCheck, Info, ListChecks, ShieldAlert, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { cn } from '@/lib/utils'
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/features/notifications/api/notification-queries'
import type { NotificationItem } from '@/features/notifications/types'

const TYPE_ICON_MAP: Record<NotificationItem['type'], LucideIcon> = {
  task: ListChecks,
  deadline: ShieldAlert,
  overdue: ShieldAlert,
  leave: CalendarOff,
  system: Bell,
}

const TYPE_LABEL_MAP: Record<NotificationItem['type'], string> = {
  task: 'Công việc',
  deadline: 'Sắp đến hạn',
  overdue: 'Quá hạn',
  leave: 'Nghỉ phép',
  system: 'Hệ thống',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications()
  const { mutate: markAsRead } = useMarkNotificationAsRead()
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Thông báo</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc.` : 'Bạn đã đọc hết thông báo.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllAsRead()} disabled={isMarkingAll}>
            <CheckCheck className="size-4" />
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={6} columns={1} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && notifications.length === 0 && (
          <EmptyState icon={Bell} title="Chưa có thông báo" description="Thông báo mới sẽ xuất hiện ở đây." />
        )}
        {!isLoading && !isError && notifications.length > 0 && (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = TYPE_ICON_MAP[notification.type] ?? Info
              const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: vi,
              })

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent',
                      !notification.isRead && 'bg-accent/30'
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm leading-snug', !notification.isRead && 'font-semibold')}>
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABEL_MAP[notification.type]}</p>
                    </div>
                    {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
