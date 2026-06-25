import { useState } from 'react'
import { Award, GraduationCap, Pencil, Plus, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/data-state'
import { TrainingStatusBadge } from '@/components/common/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { CourseFormDialog } from '@/features/training/components/course-form-dialog'
import { CompleteTrainingDialog } from '@/features/training/components/complete-training-dialog'
import {
  useCompleteTraining,
  useCourses,
  useEnrollTraining,
  useSaveCourse,
} from '@/features/training/api/training-queries'
import type { CompleteTrainingFormValues, CourseFormValues, TrainingCourse, TrainingEnrollment } from '@/features/training/types'

export function TrainingPage() {
  const { user } = useAuth()
  const canManage = useCanEdit('Training')

  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [activeEnrollment, setActiveEnrollment] = useState<TrainingEnrollment | null>(null)

  const { data: courses = [], isLoading, isError, refetch } = useCourses()
  const saveCourseMutation = useSaveCourse()
  const enrollMutation = useEnrollTraining()
  const completeMutation = useCompleteTraining()

  const handleSaveCourse = async (values: CourseFormValues): Promise<void> => {
    try {
      await saveCourseMutation.mutateAsync({ id: editingCourse?.id ?? 0, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu khóa đào tạo thất bại.')
      throw err
    }
  }

  const handleEnroll = async (courseId: number): Promise<void> => {
    if (!user?.employeeId) {
      alert('Tài khoản của bạn chưa được gắn với hồ sơ nhân viên.')
      return
    }
    try {
      await enrollMutation.mutateAsync({ courseId, employeeId: user.employeeId })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Đăng ký khóa đào tạo thất bại.')
    }
  }

  const handleComplete = async (enrollmentId: number, values: CompleteTrainingFormValues): Promise<void> => {
    try {
      await completeMutation.mutateAsync({ enrollmentId, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cập nhật trạng thái thất bại.')
      throw err
    }
  }

  const openCreateCourse = () => {
    setEditingCourse(null)
    setCourseDialogOpen(true)
  }

  const openEditCourse = (course: TrainingCourse) => {
    setEditingCourse(course)
    setCourseDialogOpen(true)
  }

  const openCompleteDialog = (enrollment: TrainingEnrollment) => {
    setActiveEnrollment(enrollment)
    setCompleteDialogOpen(true)
  }

  const isEnrolled = (course: TrainingCourse): boolean =>
    user?.employeeId != null && course.enrollments.some((e) => e.employeeId === user.employeeId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Đào tạo</h1>
          <p className="text-sm text-muted-foreground">Khóa đào tạo nội bộ, đăng ký tham gia và quản lý chứng chỉ.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreateCourse}>
            <Plus className="size-4" />
            Thêm khóa đào tạo
          </Button>
        )}
      </div>

      {isLoading && <CardGridSkeleton count={3} />}
      {isError && (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      )}
      {!isLoading && !isError && courses.length === 0 && (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Chưa có khóa đào tạo"
            description="Thêm khóa đào tạo nội bộ đầu tiên."
            actionLabel={canManage ? 'Thêm khóa đào tạo' : undefined}
            onAction={canManage ? openCreateCourse : undefined}
          />
        </Card>
      )}

      {!isLoading && !isError && courses.length > 0 && (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">{course.name}</p>
                  {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {course.instructor && `Giảng viên: ${course.instructor} · `}
                    {formatDate(course.startDate)}
                    {course.endDate ? ` – ${formatDate(course.endDate)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!canManage && (
                    <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)} disabled={isEnrolled(course)}>
                      <UserPlus className="size-3.5" />
                      {isEnrolled(course) ? 'Đã đăng ký' : 'Đăng ký'}
                    </Button>
                  )}
                  {canManage && (
                    <Button size="icon" variant="ghost" onClick={() => openEditCourse(course)}>
                      <Pencil className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {course.enrollments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hoàn thành</TableHead>
                      <TableHead>Chứng chỉ</TableHead>
                      {canManage && <TableHead className="text-right">Hành động</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {course.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.employeeName}</TableCell>
                        <TableCell>
                          <TrainingStatusBadge status={enrollment.status} />
                        </TableCell>
                        <TableCell>{enrollment.completedDate ? formatDate(enrollment.completedDate) : '—'}</TableCell>
                        <TableCell>
                          {enrollment.certificateCode ? (
                            <span className="inline-flex items-center gap-1">
                              <Award className="size-3.5 text-success" />
                              {enrollment.certificateCode}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => openCompleteDialog(enrollment)}>
                              <Pencil className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          ))}
        </div>
      )}

      <CourseFormDialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen} course={editingCourse} onSubmit={handleSaveCourse} />
      <CompleteTrainingDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        enrollment={activeEnrollment}
        onSubmit={handleComplete}
      />
    </div>
  )
}
