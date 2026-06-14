import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { completeTraining, enrollTraining, getCourses, saveCourse } from '@/features/training/api/training-api'
import type { CompleteTrainingFormValues, CourseFormValues } from '@/features/training/types'

const COURSES_KEY = ['training-courses'] as const

export function useCourses() {
  return useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => getCourses(),
  })
}

export function useSaveCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: CourseFormValues }) => saveCourse(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}

export function useEnrollTraining() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, employeeId }: { courseId: number; employeeId: number }) => enrollTraining(courseId, employeeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}

export function useCompleteTraining() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, values }: { enrollmentId: number; values: CompleteTrainingFormValues }) =>
      completeTraining(enrollmentId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}
