import { useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/data-state'
import { ProjectStatusBadge } from '@/components/common/status-badge'
import { formatCurrencyVnd, formatDate } from '@/lib/formatters'
import { MemberAvatarStack } from '@/features/projects/components/member-avatar-stack'
import { ProjectProgressBar } from '@/features/projects/components/project-progress-bar'
import { ProjectFormDialog } from '@/features/projects/components/project-form-dialog'
import { useCreateProject, useProjects } from '@/features/projects/api/project-queries'
import type { ProjectFormValues } from '@/features/projects/types'

export function ProjectListPage() {
  const { data: projects = [], isLoading, isError, refetch } = useProjects()
  const createProject = useCreateProject()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCreate = async (values: ProjectFormValues): Promise<void> => {
    await createProject.mutateAsync(values)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dự án</h1>
          <p className="text-sm text-muted-foreground">Theo dõi dự án và tiến độ thực hiện</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Tạo dự án
        </Button>
      </div>

      {isLoading && <CardGridSkeleton count={4} />}

      {isError && (
        <Card className="p-0">
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={FolderKanban}
            title="Chưa có dự án nào"
            description="Tạo dự án đầu tiên để bắt đầu theo dõi tiến độ."
            actionLabel="Tạo dự án"
            onAction={() => setDialogOpen(true)}
          />
        </Card>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {project.code} - {project.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Chủ đầu tư: {project.investor || '—'}
                    </div>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)} • Ngân sách:{' '}
                  {formatCurrencyVnd(project.budget)}
                </div>

                <ProjectProgressBar progress={project.progress} status={project.status} />

                <MemberAvatarStack members={project.members} />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
    </div>
  )
}
