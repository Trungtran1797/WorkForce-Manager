import { useMemo } from 'react'
import {
  TrendingUp,
  Briefcase,
  GraduationCap,
  Target,
  Star,
  Award,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useMyProfile } from '@/features/employees/api/employee-queries'
import { useAuth } from '@/features/auth/context/auth-context'
import { useContracts } from '@/features/contracts/api/contract-queries'
import { useCourses } from '@/features/training/api/training-queries'
import { useOkrs } from '@/features/okrs/api/okr-queries'
import type { OkrObjective } from '@/features/okrs/types'
import type { TrainingCourse } from '@/features/training/types'

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  Probation: 'Thử việc',
  Official: 'Chính thức',
  Appendix: 'Phụ lục',
}

interface Milestone {
  date: string
  type: 'join' | 'contract' | 'training' | 'okr'
  title: string
  subtitle?: string
  badge?: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysSinceJoin(hireDateStr?: string): string {
  if (!hireDateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(hireDateStr).getTime()) / (1000 * 60 * 60 * 24))
  const years = Math.floor(diff / 365)
  const months = Math.floor((diff % 365) / 30)
  if (years > 0) return `${years} năm ${months} tháng`
  return `${months} tháng`
}

export function CareerPathSection() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const { data: contracts = [] } = useContracts()
  const { data: courses = [] } = useCourses()
  const { data: okrs = [] } = useOkrs({})

  const employeeId = user?.employeeId

  const myContracts = useMemo(
    () =>
      contracts
        .filter((c) => c.employeeId === employeeId)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [contracts, employeeId],
  )

  const completedEnrollments = useMemo(() => {
    const result: { course: TrainingCourse; completedDate: string; certificateCode: string | null }[] = []
    courses.forEach((c) => {
      c.enrollments
        .filter((e) => e.employeeId === employeeId && e.completedDate)
        .forEach((e) => {
          result.push({ course: c, completedDate: e.completedDate!, certificateCode: e.certificateCode })
        })
    })
    return result
  }, [courses, employeeId])

  const completedOkrs = useMemo(
    () => (okrs as OkrObjective[]).filter((o) => o.employeeId === employeeId && o.status === 'Achieved'),
    [okrs, employeeId],
  )

  const milestones = useMemo<Milestone[]>(() => {
    const list: Milestone[] = []

    if (profile?.hireDate) {
      list.push({
        date: profile.hireDate,
        type: 'join',
        title: 'Gia nhập công ty',
        subtitle: `Phòng ${profile.departmentName ?? '—'} · ${profile.position ?? '—'}`,
        badge: 'Bắt đầu',
        color: 'text-success',
        icon: Star,
      })
    }

    myContracts.forEach((c) => {
      list.push({
        date: c.startDate,
        type: 'contract',
        title: `Hợp đồng ${CONTRACT_TYPE_LABEL[c.contractType] ?? c.contractType}`,
        subtitle: `${c.contractCode}${c.endDate ? ` · Đến ${formatDate(c.endDate)}` : ' · Không xác định thời hạn'}`,
        badge: CONTRACT_TYPE_LABEL[c.contractType],
        color: c.contractType === 'Official' ? 'text-primary' : 'text-warning',
        icon: FileText,
      })
    })

    completedEnrollments.forEach(({ course, completedDate, certificateCode }) => {
      list.push({
        date: completedDate,
        type: 'training',
        title: `Hoàn thành: ${course.name}`,
        subtitle: certificateCode ? `Chứng chỉ: ${certificateCode}` : undefined,
        badge: 'Đào tạo',
        color: 'text-purple-500',
        icon: GraduationCap,
      })
    })

    completedOkrs.forEach((o) => {
      list.push({
        date: new Date().toISOString(),
        type: 'okr',
        title: `OKR hoàn thành: ${o.title}`,
        subtitle: o.period,
        badge: 'OKR',
        color: 'text-orange-500',
        icon: Target,
      })
    })

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [profile, myContracts, completedEnrollments, completedOkrs])

  if (isLoading) {
    return (
      <Card className="p-6 border-border bg-card/50">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-2 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Profile summary */}
      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary/20 to-success/20" />
        <CardContent className="relative pt-0 px-4 pb-4">
          <Avatar className="absolute -top-6 size-14 border-4 border-card shadow-md">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {profile?.fullName?.slice(0, 2).toUpperCase() ?? '??'}
            </AvatarFallback>
          </Avatar>
          <div className="pt-10 space-y-3">
            <div>
              <h2 className="text-base font-bold text-foreground">{profile?.fullName ?? user?.username}</h2>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {profile?.position ?? '—'}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {profile?.departmentName ?? '—'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, color: 'text-primary', label: 'Vào làm', value: profile?.hireDate ? formatDate(profile.hireDate) : '—' },
                { icon: TrendingUp, color: 'text-success', label: 'Thâm niên', value: daysSinceJoin(profile?.hireDate) },
                { icon: MapPin, color: 'text-warning', label: 'Phòng ban', value: profile?.departmentName ?? '—' },
                { icon: Briefcase, color: 'text-purple-500', label: 'Hợp đồng', value: `${myContracts.length} loại` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className={`size-3.5 ${item.color} shrink-0`} />
                  <span>{item.label}: <span className="font-medium text-foreground">{item.value}</span></span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
              {[
                { label: 'Hợp đồng', value: myContracts.length, icon: FileText, color: 'text-primary' },
                { label: 'Đào tạo', value: completedEnrollments.length, icon: GraduationCap, color: 'text-purple-500' },
                { label: 'OKR đạt', value: completedOkrs.length, icon: Award, color: 'text-orange-500' },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <s.icon className={`size-4 mx-auto mb-1 ${s.color}`} />
                  <p className="text-base font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-border bg-card/50 p-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          Lộ trình thăng tiến
        </h3>

        {milestones.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Star className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu lộ trình.</p>
            <p className="text-xs mt-1">Dữ liệu sẽ cập nhật khi có hợp đồng, đào tạo và OKR hoàn thành.</p>
          </div>
        ) : (
          <div className="relative">
            {milestones.map((milestone, idx) => {
              const Icon = milestone.icon
              const isLast = idx === milestones.length - 1
              return (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center size-8 rounded-full border-2 bg-card z-10 shrink-0 ${milestone.type === 'join' ? 'border-success bg-success/10' : 'border-border'}`}>
                      <Icon className={`size-4 ${milestone.color}`} />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-border/50 min-h-6" />}
                  </div>
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{milestone.title}</p>
                          {milestone.badge && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                              {milestone.badge}
                            </Badge>
                          )}
                        </div>
                        {milestone.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{milestone.subtitle}</p>
                        )}
                      </div>
                      <time className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {formatDate(milestone.date)}
                      </time>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
