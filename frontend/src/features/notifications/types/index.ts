export interface NotificationItem {
  id: number
  title: string
  message: string
  type: 'task' | 'deadline' | 'overdue' | 'leave' | 'system'
  isRead: boolean
  link: string | null
  createdAt: string
}
