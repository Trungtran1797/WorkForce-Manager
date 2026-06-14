import type { TrainingStatus } from '@/components/common/status-badge'

export interface TrainingEnrollment {
  id: number
  employeeId: number
  employeeName: string
  status: TrainingStatus
  completedDate: string | null
  certificateCode: string | null
}

export interface TrainingCourse {
  id: number
  name: string
  description: string | null
  instructor: string | null
  startDate: string
  endDate: string | null
  enrollments: TrainingEnrollment[]
}

export interface CourseFormValues {
  name: string
  description: string
  instructor: string
  startDate: string
  endDate: string
}

export interface CompleteTrainingFormValues {
  status: TrainingStatus
  certificateCode: string
}
