import { apiClient } from '@/lib/api-client'
import type { DashboardStats, RecentActivity, WeeklyProgressPoint } from '@/features/dashboard/types'

const BASE = '/dashboard'

export function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>(`${BASE}/stats`)
}

export function getWeeklyProgress(): Promise<WeeklyProgressPoint[]> {
  return apiClient.get<WeeklyProgressPoint[]>(`${BASE}/weekly-progress`)
}

export function getRecentActivities(): Promise<RecentActivity[]> {
  return apiClient.get<RecentActivity[]>(`${BASE}/recent-activities`)
}
