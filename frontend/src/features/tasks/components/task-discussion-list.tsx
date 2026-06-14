import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'
import { formatDateTime, formatFileSize } from '@/lib/formatters'
import { useAuth } from '@/features/auth/context/auth-context'
import {
  downloadTaskAttachment,
  useDeleteTaskAttachment,
  useDeleteTaskComment,
  useTaskComments,
} from '@/features/tasks/api/task-discussion-queries'
import { isActivity, parseActivityContent } from '@/features/tasks/lib/activity-log'
import type { TaskAttachment } from '@/features/tasks/types'

const PAGE_SIZE = 10

const FILE_ICON_MAP: Record<string, typeof File> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  zip: FileArchive,
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return FILE_ICON_MAP[extension] ?? File
}

interface TaskDiscussionListProps {
  taskId: number
}

export function TaskDiscussionList({ taskId }: TaskDiscussionListProps) {
  const [page, setPage] = useState(1)
  const { user, hasRole } = useAuth()
  const canManage = hasRole('SuperAdmin', 'Manager')

  const { data, isLoading, isError, refetch } = useTaskComments(taskId, page, PAGE_SIZE)
  const deleteComment = useDeleteTaskComment(taskId)
  const deleteAttachment = useDeleteTaskAttachment(taskId)

  const comments = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const handleDeleteComment = (commentId: number): void => {
    if (!window.confirm('Xóa bình luận này?')) return
    deleteComment.mutate(commentId, {
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'Xóa bình luận thất bại.'
        toast({ title: 'Xóa thất bại', description: message, variant: 'destructive' })
      },
    })
  }

  const handleDeleteAttachment = (attachmentId: number): void => {
    if (!window.confirm('Xóa file đính kèm này?')) return
    deleteAttachment.mutate(attachmentId, {
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'Xóa file thất bại.'
        toast({ title: 'Xóa thất bại', description: message, variant: 'destructive' })
      },
    })
  }

  const handleDownload = async (attachment: TaskAttachment): Promise<void> => {
    try {
      await downloadTaskAttachment(taskId, attachment.id, attachment.fileName)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Tải file thất bại.'
      toast({ title: 'Tải file thất bại', description: message, variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <Card className="p-0">
        <TableSkeleton rows={4} columns={1} />
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="p-0">
        <ErrorState onRetry={() => void refetch()} />
      </Card>
    )
  }

  if (comments.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={MessageSquare}
          title="Chưa có thảo luận nào"
          description="Hãy là người đầu tiên bình luận về công việc này."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const activity = isActivity(comment.content)
        const canDeleteComment = canManage || (!activity && comment.authorId === user?.id)

        if (activity) {
          const lines = parseActivityContent(comment.content).split('\n').filter(Boolean)

          return (
            <Card key={comment.id} className="space-y-2 border-dashed bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">
                      {comment.authorName}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        đã cập nhật công việc
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(comment.createdDate)}
                    </div>
                  </div>
                </div>
                {canDeleteComment && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xóa nhật ký"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
                {lines.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </Card>
          )
        }

        return (
          <Card key={comment.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{comment.authorName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(comment.createdDate)}
                </div>
              </div>
              {canDeleteComment && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Xóa bình luận"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>

            <p className="whitespace-pre-wrap text-sm">{comment.content}</p>

            {comment.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comment.attachments.map((attachment) => {
                  const Icon = getFileIcon(attachment.fileName)
                  const canDeleteAttachment =
                    canManage || comment.authorId === user?.id

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="max-w-[180px] truncate">{attachment.fileName}</span>
                      <span className="text-muted-foreground">
                        {formatFileSize(attachment.fileSizeBytes)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDownload(attachment)}
                        aria-label={`Tải file ${attachment.fileName}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Download className="size-3.5" />
                      </button>
                      {canDeleteAttachment && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          aria-label={`Xóa file ${attachment.fileName}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
