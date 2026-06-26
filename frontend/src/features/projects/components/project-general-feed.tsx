import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  ListTodo,
  MessageSquare,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { EmptyState, TableSkeleton } from '@/components/common/data-state'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'
import { formatDateTime, formatFileSize } from '@/lib/formatters'
import {
  downloadProjectAttachment,
  getProjectComments,
} from '@/features/projects/api/project-discussion-api'
import {
  downloadTaskAttachment,
  getTaskComments,
} from '@/features/tasks/api/task-discussion-api'
import type { ProjectAttachment, ProjectComment } from '@/features/projects/types'
import type { Task, TaskAttachment, TaskComment } from '@/features/tasks/types'

// ─── File icons ───────────────────────────────────────────────────────────────
const FILE_ICON_MAP: Record<string, typeof File> = {
  pdf: FileText, doc: FileText, docx: FileText,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet,
  png: ImageIcon, jpg: ImageIcon, jpeg: ImageIcon,
  zip: FileArchive,
}
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return FILE_ICON_MAP[ext] ?? File
}

// ─── Unified feed item ────────────────────────────────────────────────────────
type FeedSource =
  | { kind: 'project'; projectId: number; projectCode: string }
  | { kind: 'task'; taskId: number; taskCode: string; taskTitle: string; parentTitle?: string | null }

interface FeedItem {
  key: string
  authorName: string
  content: string
  createdDate: string
  attachments: (ProjectAttachment | TaskAttachment)[]
  source: FeedSource
}

function toFeedFromProject(comment: ProjectComment, projectCode: string): FeedItem {
  return {
    key: `proj-${comment.id}`,
    authorName: comment.authorName,
    content: comment.content,
    createdDate: comment.createdDate,
    attachments: comment.attachments,
    source: { kind: 'project', projectId: comment.projectId, projectCode },
  }
}

function toFeedFromTask(comment: TaskComment, task: Task): FeedItem {
  return {
    key: `task-${comment.id}`,
    authorName: comment.authorName,
    content: comment.content,
    createdDate: comment.createdDate,
    attachments: comment.attachments,
    source: {
      kind: 'task',
      taskId: comment.taskId,
      taskCode: task.code,
      taskTitle: task.title,
      parentTitle: task.parentTaskTitle,
    },
  }
}

// ─── Source label badge ───────────────────────────────────────────────────────
function SourceBadge({ source }: { source: FeedSource }) {
  if (source.kind === 'project') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
        <FolderOpen className="size-3" />
        Dự án · {source.projectCode}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
      <ListTodo className="size-3" />
      {source.taskCode} · {source.taskTitle}
      {source.parentTitle && (
        <span className="text-muted-foreground">← {source.parentTitle}</span>
      )}
    </span>
  )
}

// ─── Attachment inline display ────────────────────────────────────────────────
function AttachmentRow({
  attachment,
  onDownload,
}: {
  attachment: ProjectAttachment | TaskAttachment
  onDownload: () => void
}) {
  const FileIcon = getFileIcon(attachment.fileName)
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="max-w-[200px] truncate">{attachment.fileName}</span>
      <span className="text-muted-foreground">{formatFileSize(attachment.fileSizeBytes)}</span>
      <button
        type="button"
        onClick={onDownload}
        aria-label={`Tải ${attachment.fileName}`}
        className="ml-auto text-muted-foreground hover:text-primary"
      >
        <Download className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ProjectGeneralFeedProps {
  projectId: number
  projectCode: string
  tasks: Task[]
}

export function ProjectGeneralFeed({ projectId, projectCode, tasks }: ProjectGeneralFeedProps) {
  // 1. Fetch project-level comments (page 1, up to 200)
  const projectCommentsQuery = useQuery({
    queryKey: ['project-comments', projectId, 1, 200],
    queryFn: () => getProjectComments(projectId, 1, 200),
    enabled: projectId > 0,
  })

  // 2. Fetch task-level comments for every task in the project
  const taskQueries = useQueries({
    queries: tasks.map((task) => ({
      queryKey: ['task-comments', task.id, 1, 200],
      queryFn: () => getTaskComments(task.id, 1, 200),
      enabled: task.id > 0,
    })),
  })

  // 3. Merge + sort newest-first
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = []

    // Project comments
    for (const c of projectCommentsQuery.data?.items ?? []) {
      items.push(toFeedFromProject(c, projectCode))
    }

    // Task comments
    taskQueries.forEach((q, idx) => {
      const task = tasks[idx]
      if (!task) return
      for (const c of q.data?.items ?? []) {
        items.push(toFeedFromTask(c, task))
      }
    })

    return items.sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    )
  }, [projectCommentsQuery.data, taskQueries, tasks, projectCode])

  const isLoading =
    projectCommentsQuery.isLoading || taskQueries.some((q) => q.isLoading)

  const handleDownloadProject = async (
    attachmentId: number,
    fileName: string,
  ): Promise<void> => {
    try {
      await downloadProjectAttachment(projectId, attachmentId, fileName)
    } catch (err) {
      toast({
        title: 'Tải file thất bại',
        description: err instanceof ApiError ? err.message : 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadTask = async (
    taskId: number,
    attachmentId: number,
    fileName: string,
  ): Promise<void> => {
    try {
      await downloadTaskAttachment(taskId, attachmentId, fileName)
    } catch (err) {
      toast({
        title: 'Tải file thất bại',
        description: err instanceof ApiError ? err.message : 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="p-0">
        <TableSkeleton rows={5} columns={1} />
      </Card>
    )
  }

  if (feed.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={MessageSquare}
          title="Chưa có thảo luận nào"
          description="Hãy là người đầu tiên bình luận về dự án hoặc công việc."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {feed.map((item) => (
        <Card key={item.key} className="gap-0 px-4 py-3">
          {/* Header: author · timestamp + source badge — single compact row */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold">{item.authorName}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDateTime(item.createdDate)}
              </span>
            </div>
            <SourceBadge source={item.source} />
          </div>

          {/* Content */}
          {item.content && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm">{item.content}</p>
          )}

          {/* Attachments */}
          {item.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.attachments.map((att) => (
                <AttachmentRow
                  key={att.id}
                  attachment={att}
                  onDownload={() => {
                    if (item.source.kind === 'project') {
                      void handleDownloadProject(att.id, att.fileName)
                    } else {
                      void handleDownloadTask(item.source.taskId, att.id, att.fileName)
                    }
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      ))}

      <p className="text-center text-xs text-muted-foreground pt-1">
        Hiển thị {feed.length} hoạt động · sắp xếp mới nhất trước
      </p>
    </div>
  )
}
