import type { KpiCardData, RecentActivity, WeeklyProgressPoint } from '@/features/dashboard/types'

export const MOCK_KPI_CARDS: KpiCardData[] = [
  {
    label: 'Tổng nhân viên',
    value: '128',
    icon: 'users',
    helperText: '+4 tháng này',
    helperVariant: 'success',
  },
  {
    label: 'Công việc đang thực hiện',
    value: '42',
    icon: 'loader',
    helperText: 'công việc',
    helperVariant: 'muted',
  },
  {
    label: 'Công việc quá hạn',
    value: '7',
    icon: 'alert-triangle',
    helperText: 'cần xử lý ngay',
    helperVariant: 'destructive',
  },
  {
    label: 'Dự án đang triển khai',
    value: '9',
    icon: 'folder-kanban',
    helperText: 'tổng 15 dự án',
    helperVariant: 'success',
  },
  {
    label: 'Công việc hoàn thành',
    value: '186',
    icon: 'check-circle',
    helperText: 'trong tháng này',
    helperVariant: 'success',
  },
]

export const MOCK_WEEKLY_PROGRESS: WeeklyProgressPoint[] = [
  { day: 'T2', completed: 12, inProgress: 8 },
  { day: 'T3', completed: 18, inProgress: 10 },
  { day: 'T4', completed: 15, inProgress: 12 },
  { day: 'T5', completed: 24, inProgress: 9 },
  { day: 'T6', completed: 21, inProgress: 14 },
  { day: 'T7', completed: 16, inProgress: 6 },
  { day: 'CN', completed: 9, inProgress: 3 },
]

export const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    actor: 'Nguyễn Văn A',
    action: 'hoàn thành công việc "Thiết kế UI Login"',
    timestamp: '5 phút trước',
    type: 'success',
  },
  {
    id: '2',
    actor: 'Trần Thị B',
    action: 'tạo dự án mới "Website TMĐT"',
    timestamp: '1 giờ trước',
    type: 'create',
  },
  {
    id: '3',
    actor: 'Lê Văn C',
    action: 'gửi đơn xin nghỉ phép 2 ngày',
    timestamp: '3 giờ trước',
    type: 'warning',
  },
  {
    id: '4',
    actor: 'Phạm Thị D',
    action: 'cập nhật tiến độ dự án "Hệ thống ERP nội bộ" lên 90%',
    timestamp: '5 giờ trước',
    type: 'success',
  },
  {
    id: '5',
    actor: 'Hoàng Văn E',
    action: 'được giao công việc mới "Viết tài liệu API"',
    timestamp: 'Hôm qua',
    type: 'create',
  },
]
