import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  className?: string
  barClassName?: string
}

export function ProgressBar({ value, className, barClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const color =
    clamped >= 100 ? 'bg-success' : clamped >= 50 ? 'bg-primary' : clamped > 0 ? 'bg-warning' : 'bg-muted-foreground/30'

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all', color, barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
