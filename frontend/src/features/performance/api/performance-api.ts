import { apiClient } from '@/lib/api-client'
import type { RatingLevel, ReviewStatus, ReviewType } from '@/components/common/status-badge'
import type {
  CreateReviewFormValues,
  PerformanceReview,
  ReviewCriterion,
  SubmitReviewFormValues,
  TeamReviewFilters,
} from '@/features/performance/types'

interface BackendCriterionDto {
  id: number
  criterion: string
  score: number
  weight: number
  note: string | null
}

interface BackendReviewDto {
  id: number
  employeeId: number
  employeeName: string
  reviewerId: number
  reviewerName: string
  period: string
  reviewType: string
  status: string
  overallScore: number
  overallRating: string
  comment: string | null
  submittedDate: string | null
  criteria: BackendCriterionDto[]
}

interface BackendPaginated<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const BASE = '/performance-reviews'

function mapCriterion(dto: BackendCriterionDto): ReviewCriterion {
  return { ...dto }
}

function mapReview(dto: BackendReviewDto): PerformanceReview {
  return {
    ...dto,
    reviewType: dto.reviewType as ReviewType,
    status: dto.status as ReviewStatus,
    overallRating: dto.overallRating as RatingLevel,
    criteria: dto.criteria.map(mapCriterion),
  }
}

export async function getMyReviews(): Promise<PerformanceReview[]> {
  const data = await apiClient.get<BackendReviewDto[]>(`${BASE}/my`)
  return data.map(mapReview)
}

export async function getTeamReviews(filters: TeamReviewFilters): Promise<PerformanceReview[]> {
  const params = new URLSearchParams({ pageNumber: '1', pageSize: '100' })
  if (filters.period) params.set('period', filters.period)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  const data = await apiClient.get<BackendPaginated<BackendReviewDto>>(`${BASE}?${params.toString()}`)
  return data.items.map(mapReview)
}

export async function createReview(values: CreateReviewFormValues): Promise<PerformanceReview> {
  const dto = await apiClient.post<BackendReviewDto>(BASE, {
    employeeId: Number(values.employeeId),
    reviewerId: Number(values.reviewerId),
    period: values.period,
    reviewType: values.reviewType,
    criteria: values.criteria.map((c) => ({ criterion: c.criterion, weight: c.weight })),
  })
  return mapReview(dto)
}

export async function submitReview(reviewId: number, values: SubmitReviewFormValues): Promise<PerformanceReview> {
  const dto = await apiClient.post<BackendReviewDto>(`${BASE}/${reviewId}/submit`, {
    criteria: values.criteria.map((c) => ({ criterionId: c.criterionId, score: c.score, note: c.note || null })),
    comment: values.comment || null,
  })
  return mapReview(dto)
}
