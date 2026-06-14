import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { ReviewCriterion } from '@/features/performance/types'

export function ReviewResultChart({ criteria }: { criteria: ReviewCriterion[] }) {
  const data = criteria.map((c) => ({ criterion: c.criterion, score: c.score }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis dataKey="criterion" className="text-xs fill-muted-foreground" />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Radar name="Điểm" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
