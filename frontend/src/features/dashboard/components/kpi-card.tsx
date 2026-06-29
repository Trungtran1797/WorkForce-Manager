import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Loader,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { KpiCardData } from '@/features/dashboard/types'

const ICON_MAP: Record<KpiCardData['icon'], LucideIcon> = {
  users: Users,
  loader: Loader,
  'alert-triangle': AlertTriangle,
  'folder-kanban': FolderKanban,
  'check-circle': CheckCircle2,
}

const ICON_BG_MAP: Record<KpiCardData['icon'], string> = {
  users: 'icon-bg-primary',
  loader: 'icon-bg-primary',
  'alert-triangle': 'icon-bg-destructive',
  'folder-kanban': 'icon-bg-success',
  'check-circle': 'icon-bg-success',
}

const METRIC_TEXT_MAP: Record<KpiCardData['icon'], string> = {
  users: 'gradient-text-primary',
  loader: 'gradient-text-primary',
  'alert-triangle': 'text-destructive',
  'folder-kanban': 'gradient-text-success',
  'check-circle': 'gradient-text-success',
}

const BORDER_MAP: Record<KpiCardData['icon'], string> = {
  users: 'border-l-4 border-l-primary/30',
  loader: 'border-l-4 border-l-primary/30',
  'alert-triangle': 'border-l-4 border-l-destructive/30',
  'folder-kanban': 'border-l-4 border-l-success/30',
  'check-circle': 'border-l-4 border-l-success/30',
}

const HELPER_COLOR_MAP: Record<KpiCardData['helperVariant'], string> = {
  success: 'text-success',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
}

export function KpiCard({ data }: { data: KpiCardData }) {
  const Icon = ICON_MAP[data.icon]

  const card = (
    <Card className={cn('gap-3 card-hover', BORDER_MAP[data.icon], data.to && 'cursor-pointer')}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{data.label}</span>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-white', ICON_BG_MAP[data.icon])}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className={cn('text-3xl font-bold', METRIC_TEXT_MAP[data.icon])}>
        {data.value}
      </div>
      <div className={cn('text-xs', HELPER_COLOR_MAP[data.helperVariant])}>{data.helperText}</div>
    </Card>
  )

  if (data.to) {
    return (
      <Link to={data.to} className="block">
        {card}
      </Link>
    )
  }

  return card
}
