import type { ReportItem } from '@/features/reports/types'

export const REPORT_CATALOG: ReportItem[] = [
  {
    id: 'report-employee-performance',
    title: 'Hiệu suất nhân viên',
    description: 'Báo cáo hiệu suất làm việc theo tháng/quý cho từng nhân viên.',
    icon: 'users',
  },
  {
    id: 'report-project-progress',
    title: 'Tiến độ dự án',
    description: 'Tổng hợp tiến độ thực hiện của tất cả dự án đang triển khai.',
    icon: 'folder-kanban',
  },
  {
    id: 'report-task-completion',
    title: 'Tỷ lệ hoàn thành công việc',
    description: 'Thống kê tỷ lệ hoàn thành công việc theo trạng thái và độ ưu tiên.',
    icon: 'list-checks',
  },
  {
    id: 'report-department-statistics',
    title: 'Thống kê phòng ban',
    description: 'Số lượng nhân sự, dự án và công việc theo từng phòng ban.',
    icon: 'building-2',
  },
  {
    id: 'report-attendance',
    title: 'Báo cáo chấm công',
    description: 'Tổng hợp giờ công, đi muộn, vắng mặt theo cá nhân hoặc phòng ban.',
    icon: 'clock',
  },
]
