import { useQuery } from '@tanstack/react-query'
import {
  getDashboardStats,
  getRecentActivities,
  getWeeklyProgress,
} from '@/features/dashboard/api/dashboard-api'

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  stats: () => [...DASHBOARD_KEYS.all, 'stats'] as const,
  weeklyProgress: () => [...DASHBOARD_KEYS.all, 'weekly-progress'] as const,
  recentActivities: () => [...DASHBOARD_KEYS.all, 'recent-activities'] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(),
    queryFn: getDashboardStats,
  })
}

export function useWeeklyProgress() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.weeklyProgress(),
    queryFn: getWeeklyProgress,
  })
}

export function useRecentActivities() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.recentActivities(),
    queryFn: getRecentActivities,
  })
}
