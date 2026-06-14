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

const ICON_COLOR_MAP: Record<KpiCardData['icon'], string> = {
  users: 'text-primary',
  loader: 'text-primary',
  'alert-triangle': 'text-destructive',
  'folder-kanban': 'text-success',
  'check-circle': 'text-success',
}

const HELPER_COLOR_MAP: Record<KpiCardData['helperVariant'], string> = {
  success: 'text-success',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
}

export function KpiCard({ data }: { data: KpiCardData }) {
  const Icon = ICON_MAP[data.icon]

  const card = (
    <Card className={cn('gap-2', data.to && 'transition-colors hover:bg-accent')}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data.label}</span>
        <Icon className={cn('size-5', ICON_COLOR_MAP[data.icon])} />
      </div>
      <div
        className={cn(
          'text-3xl font-bold',
          data.icon === 'alert-triangle' && 'text-destructive'
        )}
      >
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
