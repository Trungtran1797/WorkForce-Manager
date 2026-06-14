import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createReview, getMyReviews, getTeamReviews, submitReview } from '@/features/performance/api/performance-api'
import type { CreateReviewFormValues, SubmitReviewFormValues, TeamReviewFilters } from '@/features/performance/types'

const MY_REVIEWS_KEY = ['performance-reviews', 'my'] as const
const TEAM_REVIEWS_KEY = ['performance-reviews', 'team'] as const

export function useMyReviews() {
  return useQuery({
    queryKey: MY_REVIEWS_KEY,
    queryFn: () => getMyReviews(),
  })
}

export function useTeamReviews(filters: TeamReviewFilters) {
  return useQuery({
    queryKey: [...TEAM_REVIEWS_KEY, filters],
    queryFn: () => getTeamReviews(filters),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateReviewFormValues) => createReview(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_REVIEWS_KEY })
      void queryClient.invalidateQueries({ queryKey: MY_REVIEWS_KEY })
    },
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, values }: { reviewId: number; values: SubmitReviewFormValues }) =>
      submitReview(reviewId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_REVIEWS_KEY })
      void queryClient.invalidateQueries({ queryKey: TEAM_REVIEWS_KEY })
    },
  })
}
