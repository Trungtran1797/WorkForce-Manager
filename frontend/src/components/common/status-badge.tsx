import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  AttendanceStatus,
  EmployeeStatus,
  LeaveStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@/types/common'

// ─── Task Status ─────────────────────────────────────────────────────────────

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; description: string; variant: 'gray' | 'default' | 'warning' | 'success' | 'destructive' }
> = {
  Todo:       { label: 'Cần làm',       description: 'Việc cần làm, chưa bắt đầu thực hiện.',                     variant: 'gray' },
  InProgress: { label: 'Đang thực hiện', description: 'Đang trong quá trình thực hiện.',                           variant: 'default' },
  Review:     { label: 'Chờ nghiệm thu', description: 'Đã hoàn thành và đang chờ kiểm tra, phê duyệt hoặc nghiệm thu.', variant: 'warning' },
  Done:       { label: 'Hoàn thành',    description: 'Đã hoàn thành, được xác nhận.',                             variant: 'success' },
  Cancelled:  { label: 'Đã hủy',        description: 'Đã hủy, không tiếp tục thực hiện.',                         variant: 'destructive' },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

/** Trả về nhãn văn bản của trạng thái công việc (dùng trong select/filter). */
export function getTaskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_CONFIG[status]?.label ?? status
}

// ─── Task Priority ────────────────────────────────────────────────────────────

const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; description: string; variant: 'gray' | 'default' | 'warning' | 'destructive' }
> = {
  Low:    { label: 'Thấp',      description: 'Ưu tiên thấp, có thể xử lý sau khi hoàn thành các việc quan trọng hơn.',  variant: 'gray' },
  Medium: { label: 'Trung bình', description: 'Ưu tiên trung bình, cần thực hiện trong thời gian hợp lý.',               variant: 'warning' },
  High:   { label: 'Cao',       description: 'Ưu tiên cao, cần xử lý sớm để không ảnh hưởng tiến độ.',                 variant: 'destructive' },
  Urgent: { label: 'Khẩn cấp', description: 'Cực kỳ khẩn cấp, phải xử lý ngay lập tức.',                              variant: 'destructive' },
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = TASK_PRIORITY_CONFIG[priority]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Project Status ───────────────────────────────────────────────────────────

const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; description: string; variant: 'gray' | 'default' | 'warning' | 'success' | 'destructive' }
> = {
  Planning:   { label: 'Lên kế hoạch',    description: 'Dự án đang trong giai đoạn lên kế hoạch, chưa triển khai.',           variant: 'gray' },
  InProgress: { label: 'Đang triển khai', description: 'Dự án đang được thực hiện theo kế hoạch.',                            variant: 'default' },
  OnHold:     { label: 'Tạm hoãn',        description: 'Dự án tạm thời dừng lại, chờ điều kiện để tiếp tục.',                variant: 'warning' },
  Completed:  { label: 'Hoàn thành',      description: 'Dự án đã hoàn tất và được nghiệm thu thành công.',                    variant: 'success' },
  Overdue:    { label: 'Quá hạn',         description: 'Dự án đã vượt quá thời hạn dự kiến mà chưa hoàn thành.',             variant: 'destructive' },
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Employee Status ──────────────────────────────────────────────────────────

const EMPLOYEE_STATUS_CONFIG: Record<
  EmployeeStatus,
  { label: string; description: string; variant: 'gray' | 'success' | 'warning' }
> = {
  Active:  { label: 'Đang làm việc', description: 'Nhân viên đang làm việc bình thường.',               variant: 'success' },
  Inactive: { label: 'Đã nghỉ',      description: 'Nhân viên đã nghỉ việc hoặc không còn hoạt động.',    variant: 'gray' },
  OnLeave: { label: 'Đang nghỉ phép', description: 'Nhân viên đang trong thời gian nghỉ phép được duyệt.', variant: 'warning' },
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const config = EMPLOYEE_STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Leave Status ─────────────────────────────────────────────────────────────

const LEAVE_STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; description: string; variant: 'gray' | 'default' | 'warning' | 'success' | 'destructive' }
> = {
  PendingManager: { label: 'Chờ duyệt (Quản lý)', description: 'Đơn nghỉ phép đang chờ quản lý trực tiếp phê duyệt.', variant: 'warning' },
  PendingHr:      { label: 'Chờ duyệt (HR)',       description: 'Đơn đã qua quản lý, đang chờ bộ phận HR xác nhận.', variant: 'warning' },
  Approved:       { label: 'Đã duyệt',             description: 'Đơn nghỉ phép đã được phê duyệt.',                  variant: 'default' },
  Rejected:       { label: 'Từ chối',              description: 'Đơn nghỉ phép bị từ chối.',                         variant: 'destructive' },
  Completed:      { label: 'Hoàn thành',           description: 'Kỳ nghỉ đã kết thúc.',                             variant: 'success' },
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const config = LEAVE_STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Attendance Status ────────────────────────────────────────────────────────

const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; description: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  Full:      { label: 'Đủ công',  description: 'Chấm công đủ giờ, đúng quy định.',                  variant: 'success' },
  Late:      { label: 'Đi muộn', description: 'Nhân viên đến muộn hơn giờ quy định.',              variant: 'warning' },
  EarlyLeave:{ label: 'Về sớm',  description: 'Nhân viên kết thúc ca làm việc sớm hơn quy định.', variant: 'warning' },
  Absent:    { label: 'Vắng',    description: 'Nhân viên vắng mặt không có mặt tại nơi làm việc.', variant: 'destructive' },
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = ATTENDANCE_STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Overtime Status ──────────────────────────────────────────────────────────

export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected'

const OVERTIME_STATUS_CONFIG: Record<
  OvertimeStatus,
  { label: string; description: string; variant: 'warning' | 'success' | 'destructive' }
> = {
  Pending:  { label: 'Chờ duyệt', description: 'Yêu cầu tăng ca đang chờ phê duyệt.',     variant: 'warning' },
  Approved: { label: 'Đã duyệt',  description: 'Yêu cầu tăng ca đã được phê duyệt.',      variant: 'success' },
  Rejected: { label: 'Từ chối',   description: 'Yêu cầu tăng ca đã bị từ chối.',          variant: 'destructive' },
}

export function OvertimeStatusBadge({ status }: { status: OvertimeStatus }) {
  const config = OVERTIME_STATUS_CONFIG[status] ?? OVERTIME_STATUS_CONFIG.Pending
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Payslip Status ───────────────────────────────────────────────────────────

export type PayslipStatus = 'Draft' | 'Approved' | 'Paid'

const PAYSLIP_STATUS_CONFIG: Record<
  PayslipStatus,
  { label: string; description: string; variant: 'gray' | 'default' | 'success' }
> = {
  Draft:    { label: 'Nháp',    description: 'Phiếu lương đang được soạn thảo, chưa xác nhận.',  variant: 'gray' },
  Approved: { label: 'Đã duyệt', description: 'Phiếu lương đã được phê duyệt, chờ chi trả.',      variant: 'default' },
  Paid:     { label: 'Đã trả',  description: 'Lương đã được thanh toán cho nhân viên.',           variant: 'success' },
}

export function PayslipStatusBadge({ status }: { status: PayslipStatus }) {
  const config = PAYSLIP_STATUS_CONFIG[status] ?? PAYSLIP_STATUS_CONFIG.Draft
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Contract Status ──────────────────────────────────────────────────────────

export type ContractStatus = 'Active' | 'Expired' | 'Terminated'

const CONTRACT_STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; description: string; variant: 'success' | 'gray' | 'destructive' }
> = {
  Active:     { label: 'Hiệu lực', description: 'Hợp đồng đang có hiệu lực.',              variant: 'success' },
  Expired:    { label: 'Hết hạn',  description: 'Hợp đồng đã hết thời hạn, cần gia hạn.', variant: 'gray' },
  Terminated: { label: 'Chấm dứt', description: 'Hợp đồng đã bị chấm dứt trước hạn.',     variant: 'destructive' },
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const config = CONTRACT_STATUS_CONFIG[status] ?? CONTRACT_STATUS_CONFIG.Active
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── OKR Status ───────────────────────────────────────────────────────────────

export type OkrStatus = 'Draft' | 'Active' | 'Achieved' | 'Failed'

const OKR_STATUS_CONFIG: Record<
  OkrStatus,
  { label: string; description: string; variant: 'gray' | 'default' | 'success' | 'destructive' }
> = {
  Draft:    { label: 'Nháp',          description: 'Mục tiêu đang được soạn thảo, chưa kích hoạt.',          variant: 'gray' },
  Active:   { label: 'Đang thực hiện', description: 'Mục tiêu đã được kích hoạt và đang trong quá trình thực hiện.', variant: 'default' },
  Achieved: { label: 'Đạt mục tiêu',  description: 'Mục tiêu đã được hoàn thành thành công.',                variant: 'success' },
  Failed:   { label: 'Không đạt',     description: 'Mục tiêu không được hoàn thành trong kỳ đánh giá.',      variant: 'destructive' },
}

export function OkrStatusBadge({ status }: { status: OkrStatus }) {
  const config = OKR_STATUS_CONFIG[status] ?? OKR_STATUS_CONFIG.Draft
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Review Type ──────────────────────────────────────────────────────────────

export type ReviewType = 'Self' | 'Manager' | 'Peer'

const REVIEW_TYPE_CONFIG: Record<
  ReviewType,
  { label: string; description: string; variant: 'gray' | 'default' | 'warning' }
> = {
  Self:    { label: 'Tự đánh giá',  description: 'Nhân viên tự đánh giá kết quả công việc của bản thân.', variant: 'gray' },
  Manager: { label: 'Quản lý',      description: 'Quản lý trực tiếp thực hiện đánh giá.',                variant: 'default' },
  Peer:    { label: 'Đồng nghiệp', description: 'Đồng nghiệp trong nhóm thực hiện đánh giá chéo.',     variant: 'warning' },
}

export function ReviewTypeBadge({ type }: { type: ReviewType }) {
  const config = REVIEW_TYPE_CONFIG[type] ?? REVIEW_TYPE_CONFIG.Self
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Review Status ────────────────────────────────────────────────────────────

export type ReviewStatus = 'Pending' | 'Submitted' | 'Completed'

const REVIEW_STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; description: string; variant: 'warning' | 'default' | 'success' }
> = {
  Pending:   { label: 'Chờ đánh giá', description: 'Phiếu đánh giá chưa được nộp.',        variant: 'warning' },
  Submitted: { label: 'Đã nộp',       description: 'Phiếu đánh giá đã được nộp, chờ xử lý.', variant: 'default' },
  Completed: { label: 'Hoàn thành',   description: 'Quá trình đánh giá đã hoàn tất.',       variant: 'success' },
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const config = REVIEW_STATUS_CONFIG[status] ?? REVIEW_STATUS_CONFIG.Pending
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Rating Level ─────────────────────────────────────────────────────────────

export type RatingLevel = 'Poor' | 'Average' | 'Good' | 'Excellent'

const RATING_LEVEL_CONFIG: Record<
  RatingLevel,
  { label: string; description: string; variant: 'destructive' | 'warning' | 'default' | 'success' }
> = {
  Poor:      { label: 'Yếu',      description: 'Kết quả công việc không đạt yêu cầu, cần cải thiện nhiều.', variant: 'destructive' },
  Average:   { label: 'Trung bình', description: 'Kết quả đạt mức trung bình, cần nỗ lực thêm.',            variant: 'warning' },
  Good:      { label: 'Tốt',      description: 'Kết quả tốt, hoàn thành đúng yêu cầu.',                   variant: 'default' },
  Excellent: { label: 'Xuất sắc', description: 'Kết quả vượt mong đợi, đóng góp xuất sắc.',               variant: 'success' },
}

export function RatingLevelBadge({ rating }: { rating: RatingLevel }) {
  const config = RATING_LEVEL_CONFIG[rating] ?? RATING_LEVEL_CONFIG.Average
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}

// ─── Training Status ──────────────────────────────────────────────────────────

export type TrainingStatus = 'Enrolled' | 'Completed' | 'Cancelled'

const TRAINING_STATUS_CONFIG: Record<
  TrainingStatus,
  { label: string; description: string; variant: 'default' | 'success' | 'destructive' }
> = {
  Enrolled:  { label: 'Đang học', description: 'Nhân viên đang tham gia khóa đào tạo.',   variant: 'default' },
  Completed: { label: 'Hoàn thành', description: 'Nhân viên đã hoàn thành khóa đào tạo.', variant: 'success' },
  Cancelled: { label: 'Đã huỷ',  description: 'Đăng ký khóa đào tạo đã bị hủy.',         variant: 'destructive' },
}

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const config = TRAINING_STATUS_CONFIG[status] ?? TRAINING_STATUS_CONFIG.Enrolled
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="cursor-default">{config.label}</Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  )
}
