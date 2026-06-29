import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { WeeklyProgressPoint } from '@/features/dashboard/types'

export function WeeklyProgressChart({ data }: { data: WeeklyProgressPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <defs>
          <linearGradient id="grad-completed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 71% 42%)" />
            <stop offset="100%" stopColor="hsl(158 64% 32%)" />
          </linearGradient>
          <linearGradient id="grad-inProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(217 91% 60%)" />
            <stop offset="100%" stopColor="hsl(234 89% 48%)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          className="text-xs fill-muted-foreground"
        />
        <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" width={28} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar
          dataKey="completed"
          name="Hoàn thành"
          fill="url(#grad-completed)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="inProgress"
          name="Đang thực hiện"
          fill="url(#grad-inProgress)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
