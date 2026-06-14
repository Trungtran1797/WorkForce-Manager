import { useEffect, useRef } from 'react'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { tokenStore } from '@/lib/api-client'
import { useAuth } from '@/features/auth/context/auth-context'
import { NOTIFICATIONS_KEY } from '@/features/notifications/api/notification-queries'
import type { NotificationItem } from '@/features/notifications/types'
import { toast } from '@/hooks/use-toast'

const getHubUrl = () => {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'
  return apiUrl.replace(/\/api\/v1\/?$/, '/hubs/notifications').replace(/\/api\/?$/, '/hubs/notifications')
}

export function useNotificationsRealtime() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!user) {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
      }
      return
    }

    const token = tokenStore.getAccess()
    if (!token) return

    const hubUrl = getHubUrl()
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('ReceiveNotification', (notification: NotificationItem) => {
      // 1. Tải lại danh sách thông báo từ API để có dữ liệu chuẩn có ID thực
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })

      // 2. Hiển thị UI Toast notification
      const variantMap: Record<string, 'default' | 'destructive' | 'success' | 'info'> = {
        task: 'info',
        deadline: 'destructive',
        overdue: 'destructive',
        leave: 'success',
        system: 'default'
      }

      toast({
        title: notification.title,
        description: notification.message,
        variant: variantMap[notification.type] || 'default'
      })

      // 3. Hiển thị HTML5 native notification (dự phòng khi tab chạy ngầm)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          })
        } catch (e) {
          console.error('Error displaying HTML5 notification', e)
        }
      }

      console.log(`[Realtime Notification] ${notification.title}: ${notification.message}`)
    })

    connection
      .start()
      .then(() => {
        connectionRef.current = connection
        console.log('SignalR Notification Hub connected successfully.')
        
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission()
        }
      })
      .catch((err) => {
        console.error('SignalR connection error: ', err)
      })

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
      }
    }
  }, [user, queryClient])
}
