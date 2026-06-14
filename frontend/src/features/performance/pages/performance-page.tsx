import { useState } from 'react'
import { ClipboardCheck, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/data-state'
import { RatingLevelBadge, ReviewStatusBadge, ReviewTypeBadge } from '@/components/common/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/formatters'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/features/auth/context/auth-context'
import { CreateReviewDialog } from '@/features/performance/components/create-review-dialog'
import { SubmitReviewDialog } from '@/features/performance/components/submit-review-dialog'
import { ReviewResultChart } from '@/features/performance/components/review-result-chart'
import { useCreateReview, useMyReviews, useSubmitReview, useTeamReviews } from '@/features/performance/api/performance-queries'
import type { CreateReviewFormValues, PerformanceReview, SubmitReviewFormValues } from '@/features/performance/types'

function ReviewCard({
  review,
  onSubmitClick,
  canSubmit,
}: {
  review: PerformanceReview
  onSubmitClick: (review: PerformanceReview) => void
  canSubmit: boolean
}) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-semibold">{review.employeeName}</p>
          <p className="text-xs text-muted-foreground">
            Người đánh giá: {review.reviewerName} · Kỳ {review.period}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ReviewStatusBadge status={review.status} />
          <ReviewTypeBadge type={review.reviewType} />
        </div>
      </div>

      {review.status === 'Completed' ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Điểm tổng hợp</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">{review.overallScore.toFixed(2)}</span>
              <RatingLevelBadge rating={review.overallRating} />
            </div>
          </div>
          <ReviewResultChart criteria={review.criteria} />
          {review.comment && <p className="text-sm text-muted-foreground">"{review.comment}"</p>}
          {review.submittedDate && (
            <p className="text-xs text-muted-foreground">Nộp ngày: {formatDate(review.submittedDate)}</p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{review.criteria.length} tiêu chí chưa được chấm điểm.</p>
          {canSubmit && (
            <Button size="sm" onClick={() => onSubmitClick(review)}>
              Chấm điểm
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export function PerformancePage() {
  const { user } = useAuth()
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'Manager'

  const [createOpen, setCreateOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [activeReview, setActiveReview] = useState<PerformanceReview | null>(null)
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my')

  const { data: myReviews = [], isLoading: isMyLoading, isError: isMyError, refetch: refetchMy } = useMyReviews()
  const {
    data: teamReviews = [],
    isLoading: isTeamLoading,
    isError: isTeamError,
    refetch: refetchTeam,
  } = useTeamReviews({})

  const createMutation = useCreateReview()
  const submitMutation = useSubmitReview()

  const handleCreate = async (values: CreateReviewFormValues): Promise<void> => {
    try {
      await createMutation.mutateAsync(values)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Tạo phiếu đánh giá thất bại.')
      throw err
    }
  }

  const handleSubmit = async (reviewId: number, values: SubmitReviewFormValues): Promise<void> => {
    try {
      await submitMutation.mutateAsync({ reviewId, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Nộp đánh giá thất bại.')
      throw err
    }
  }

  const openSubmit = (review: PerformanceReview) => {
    setActiveReview(review)
    setSubmitOpen(true)
  }

  const renderList = (
    list: PerformanceReview[],
    isLoading: boolean,
    isError: boolean,
    onRetry: () => void,
    canSubmit: boolean,
  ) => {
    if (isLoading) return <CardGridSkeleton count={4} />
    if (isError) {
      return (
        <Card>
          <ErrorState onRetry={onRetry} />
        </Card>
      )
    }
    if (list.length === 0) {
      return (
        <Card>
          <EmptyState icon={ClipboardCheck} title="Chưa có phiếu đánh giá" description="Chưa có dữ liệu đánh giá hiệu suất." />
        </Card>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((review) => (
          <ReviewCard key={review.id} review={review} onSubmitClick={openSubmit} canSubmit={canSubmit} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Đánh giá hiệu suất</h1>
          <p className="text-sm text-muted-foreground">Đánh giá 360 độ: tự đánh giá, quản lý và đồng nghiệp.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Tạo phiếu đánh giá
          </Button>
        )}
      </div>

      {canManage ? (
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'my' | 'team')}>
          <TabsList>
            <TabsTrigger value="my">Đánh giá của tôi</TabsTrigger>
            <TabsTrigger value="team">Đánh giá nhóm</TabsTrigger>
          </TabsList>
          <TabsContent value="my" className="mt-4">
            {renderList(myReviews, isMyLoading, isMyError, () => void refetchMy(), true)}
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            {renderList(teamReviews, isTeamLoading, isTeamError, () => void refetchTeam(), true)}
          </TabsContent>
        </Tabs>
      ) : (
        renderList(myReviews, isMyLoading, isMyError, () => void refetchMy(), true)
      )}

      <CreateReviewDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <SubmitReviewDialog open={submitOpen} onOpenChange={setSubmitOpen} review={activeReview} onSubmit={handleSubmit} />
    </div>
  )
}
