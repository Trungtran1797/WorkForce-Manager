import type { RatingLevel, ReviewStatus, ReviewType } from '@/components/common/status-badge'

export interface ReviewCriterion {
  id: number
  criterion: string
  score: number
  weight: number
  note: string | null
}

export interface PerformanceReview {
  id: number
  employeeId: number
  employeeName: string
  reviewerId: number
  reviewerName: string
  period: string
  reviewType: ReviewType
  status: ReviewStatus
  overallScore: number
  overallRating: RatingLevel
  comment: string | null
  submittedDate: string | null
  criteria: ReviewCriterion[]
}

export interface CreateReviewFormValues {
  employeeId: string
  reviewerId: string
  period: string
  reviewType: ReviewType
  criteria: { criterion: string; weight: number }[]
}

export interface SubmitReviewFormValues {
  criteria: { criterionId: number; score: number; note: string }[]
  comment: string
}

export interface TeamReviewFilters {
  period?: string
  status?: string
  search?: string
}
