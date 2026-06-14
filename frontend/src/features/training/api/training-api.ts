import { apiClient } from '@/lib/api-client'
import type { TrainingStatus } from '@/components/common/status-badge'
import type { CompleteTrainingFormValues, CourseFormValues, TrainingCourse, TrainingEnrollment } from '@/features/training/types'

interface BackendEnrollmentDto {
  id: number
  employeeId: number
  employeeName: string
  status: string
  completedDate: string | null
  certificateCode: string | null
}

interface BackendCourseDto {
  id: number
  name: string
  description: string | null
  instructor: string | null
  startDate: string
  endDate: string | null
  enrollments: BackendEnrollmentDto[]
}

const BASE = '/training-courses'

function mapEnrollment(dto: BackendEnrollmentDto): TrainingEnrollment {
  return { ...dto, status: dto.status as TrainingStatus }
}

function mapCourse(dto: BackendCourseDto): TrainingCourse {
  return { ...dto, enrollments: dto.enrollments.map(mapEnrollment) }
}

export async function getCourses(): Promise<TrainingCourse[]> {
  const data = await apiClient.get<BackendCourseDto[]>(BASE)
  return data.map(mapCourse)
}

export async function saveCourse(id: number, values: CourseFormValues): Promise<TrainingCourse> {
  const dto = await apiClient.post<BackendCourseDto>(BASE, {
    id,
    name: values.name,
    description: values.description === '' ? null : values.description,
    instructor: values.instructor === '' ? null : values.instructor,
    startDate: values.startDate,
    endDate: values.endDate === '' ? null : values.endDate,
  })
  return mapCourse(dto)
}

export async function enrollTraining(courseId: number, employeeId: number): Promise<TrainingEnrollment> {
  return apiClient.post<TrainingEnrollment>(`${BASE}/${courseId}/enroll`, { employeeId })
}

export async function completeTraining(enrollmentId: number, values: CompleteTrainingFormValues): Promise<TrainingEnrollment> {
  const dto = await apiClient.patch<BackendEnrollmentDto>(`${BASE}/enrollments/${enrollmentId}`, {
    status: values.status,
    certificateCode: values.certificateCode === '' ? null : values.certificateCode,
  })
  return mapEnrollment(dto)
}
