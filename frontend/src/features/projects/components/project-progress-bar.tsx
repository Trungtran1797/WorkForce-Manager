import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/common'

const PROGRESS_COLOR_MAP: Record<ProjectStatus, string> = {
  Planning: 'bg-muted-foreground',
  InProgress: 'bg-primary',
  OnHold: 'bg-warning',
  Completed: 'bg-success',
  Overdue: 'bg-destructive',
}

export function ProjectProgressBar({ progress, status }: { progress: number; status: ProjectStatus }) {
  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn('h-2 rounded-full transition-all', PROGRESS_COLOR_MAP[status])}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">Hoàn thành {progress}%</div>
    </div>
  )
}
