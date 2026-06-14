import { apiClient } from '@/lib/api-client'
import type { NotificationItem } from '@/features/notifications/types'

const BASE = '/notifications'

export function getNotifications(): Promise<NotificationItem[]> {
  return apiClient.get<NotificationItem[]>(BASE)
}

export function markNotificationAsRead(id: number): Promise<boolean> {
  return apiClient.put<boolean>(`${BASE}/${id}/read`)
}

export function markAllNotificationsAsRead(): Promise<boolean> {
  return apiClient.put<boolean>(`${BASE}/read-all`)
}
