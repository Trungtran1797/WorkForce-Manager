/**
 * Activity log helper for tasks.
 * Posts a system-generated comment to document field changes.
 * Log entries are prefixed with `[ACTIVITY]` so the UI can style them differently.
 */

import { addTaskComment } from '@/features/tasks/api/task-discussion-api'
import { formatDate } from '@/lib/formatters'
import { queryClient } from '@/lib/query-client'
import type { TaskStatus, TaskPriority } from '@/types/common'

// ─── Status / Priority label maps ────────────────────────────────────────────
const STATUS_LABEL: Record<TaskStatus, string> = {
  Todo: 'Cần làm',
  InProgress: 'Đang thực hiện',
  Review: 'Chờ nghiệm thu',
  Done: 'Hoàn thành',
  Cancelled: 'Đã hủy',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Urgent: 'Khẩn cấp',
}

/** Prefix used to identify activity log entries in the comment feed. */
export const ACTIVITY_PREFIX = '[ACTIVITY]'

function isActivity(content: string): boolean {
  return content.startsWith(ACTIVITY_PREFIX)
}

/** Parse raw comment content into display-ready log lines (strips prefix). */
export function parseActivityContent(content: string): string {
  return content.startsWith(ACTIVITY_PREFIX)
    ? content.slice(ACTIVITY_PREFIX.length).trimStart()
    : content
}

export { isActivity }

// ─── Post helpers ─────────────────────────────────────────────────────────────

async function postLog(taskId: number, lines: string[]): Promise<void> {
  if (lines.length === 0) return
  const content = `${ACTIVITY_PREFIX} ${lines.join('\n')}`
  try {
    await addTaskComment(taskId, content, [])
    await queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
  } catch {
    // Silently ignore — activity log is best-effort
  }
}

// ─── Status change ────────────────────────────────────────────────────────────
export async function logStatusChange(
  taskId: number,
  oldStatus: TaskStatus,
  newStatus: TaskStatus,
): Promise<void> {
  if (oldStatus === newStatus) return
  await postLog(taskId, [
    `🔄 Trạng thái: ${STATUS_LABEL[oldStatus]} → ${STATUS_LABEL[newStatus]}`,
  ])
}

// ─── Progress change ──────────────────────────────────────────────────────────
export async function logProgressChange(
  taskId: number,
  oldProgress: number,
  newProgress: number,
  newStatus?: TaskStatus,
  oldStatus?: TaskStatus,
): Promise<void> {
  const lines: string[] = []
  if (oldProgress !== newProgress) {
    lines.push(`📊 Tiến độ: ${oldProgress}% → ${newProgress}%`)
  }
  if (newStatus && oldStatus && oldStatus !== newStatus) {
    lines.push(`🔄 Trạng thái: ${STATUS_LABEL[oldStatus]} → ${STATUS_LABEL[newStatus]}`)
  }
  await postLog(taskId, lines)
}

// ─── Task edit (multiple fields) ──────────────────────────────────────────────
interface TaskSnapshot {
  title?: string
  startDate?: string
  dueDate?: string
  status?: TaskStatus
  priority?: TaskPriority
  progress?: number
  assigneeName?: string
}

export async function logTaskEdit(
  taskId: number,
  before: TaskSnapshot,
  after: TaskSnapshot,
): Promise<void> {
  const lines: string[] = []

  if (before.title !== after.title && after.title) {
    lines.push(`✏️ Tên: "${before.title}" → "${after.title}"`)
  }
  if (before.startDate && after.startDate && before.startDate !== after.startDate) {
    lines.push(
      `📅 Ngày bắt đầu: ${formatDate(before.startDate)} → ${formatDate(after.startDate)}`,
    )
  }
  if (before.dueDate && after.dueDate && before.dueDate !== after.dueDate) {
    lines.push(
      `⏰ Deadline: ${formatDate(before.dueDate)} → ${formatDate(after.dueDate)}`,
    )
  }
  if (before.status && after.status && before.status !== after.status) {
    lines.push(
      `🔄 Trạng thái: ${STATUS_LABEL[before.status]} → ${STATUS_LABEL[after.status]}`,
    )
  }
  if (before.priority && after.priority && before.priority !== after.priority) {
    lines.push(
      `⚡ Ưu tiên: ${PRIORITY_LABEL[before.priority]} → ${PRIORITY_LABEL[after.priority]}`,
    )
  }
  if (
    before.progress !== undefined &&
    after.progress !== undefined &&
    before.progress !== after.progress
  ) {
    lines.push(`📊 Tiến độ: ${before.progress}% → ${after.progress}%`)
  }
  if (before.assigneeName !== after.assigneeName) {
    lines.push(
      `👤 Người thực hiện: ${before.assigneeName || '(chưa có)'} → ${after.assigneeName || '(chưa có)'}`,
    )
  }

  await postLog(taskId, lines)
}
