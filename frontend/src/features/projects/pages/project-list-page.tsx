import { useState } from 'react'
import {
  BookTemplate,
  Copy,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/common/data-state'
import { ProjectStatusBadge } from '@/components/common/status-badge'
import { formatCurrencyVnd, formatDate } from '@/lib/formatters'
import { MemberAvatarStack } from '@/features/projects/components/member-avatar-stack'
import { ProjectProgressBar } from '@/features/projects/components/project-progress-bar'
import { ProjectFormDialog } from '@/features/projects/components/project-form-dialog'
import { TemplatePickerDialog } from '@/features/projects/components/template-picker-dialog'
import {
  useCreateProject,
  useDeleteProject,
  useMarkProjectAsTemplate,
  useProjects,
} from '@/features/projects/api/project-queries'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { useToast } from '@/hooks/use-toast'
import type { Project, ProjectFormValues } from '@/features/projects/types'
import { uploadProjectAttachments } from '@/features/projects/api/project-api'

// ─── Projects table ───────────────────────────────────────────────────────────

interface ProjectsTableProps {
  projects: Project[]
  isLoading: boolean
  canEdit: boolean
  onMarkTemplate: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProjectsTable({ projects, isLoading, canEdit, onMarkTemplate, onDelete }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[110px]">Mã dự án</TableHead>
          <TableHead>Tên dự án</TableHead>
          <TableHead className="hidden md:table-cell">Chủ đầu tư</TableHead>
          <TableHead className="hidden lg:table-cell">Thời gian</TableHead>
          <TableHead className="hidden xl:table-cell w-[130px]">Ngân sách</TableHead>
          <TableHead className="w-[160px]">Tiến độ</TableHead>
          <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
          <TableHead className="hidden lg:table-cell">Thành viên</TableHead>
          {canEdit && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-7 w-20 rounded-full" /></TableCell>
                {canEdit && <TableCell />}
              </TableRow>
            ))
          : projects.map((project) => (
              <TableRow key={project.id} className="group hover:bg-muted/50">
                <TableCell>
                  <Link
                    to={`/projects/${project.id}`}
                    className="block font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {project.code}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/projects/${project.id}`} className="block font-medium hover:text-primary">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {project.investor || '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-right tabular-nums">
                  {formatCurrencyVnd(project.budget)}
                </TableCell>
                <TableCell>
                  <ProjectProgressBar progress={project.progress} status={project.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <ProjectStatusBadge status={project.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <MemberAvatarStack members={project.members} />
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`}>Xem chi tiết</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onMarkTemplate(project)}>
                          <Star className="size-4 text-warning" />
                          Lưu làm mẫu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(project)}
                        >
                          <Trash2 className="size-4" />
                          Xóa dự án
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}

// ─── Template cards ───────────────────────────────────────────────────────────

interface TemplatesSectionProps {
  templates: Project[]
  isLoading: boolean
  canEdit: boolean
  onUnmark: (project: Project) => void
  onDelete: (project: Project) => void
  onCreateFromThis: () => void
}

function TemplatesSection({ templates, isLoading, canEdit, onUnmark, onDelete, onCreateFromThis }: TemplatesSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={BookTemplate}
        title="Chưa có mẫu quy trình"
        description="Lưu một dự án làm mẫu để tái sử dụng quy trình cho các đơn hàng tương tự."
        actionLabel={canEdit ? 'Tạo từ dự án có sẵn' : undefined}
        onAction={canEdit ? onCreateFromThis : undefined}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
      {templates.map((t, idx) => (
        <div
          key={t.id}
          className="group relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                Mẫu {idx + 1}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/projects/${t.id}`}>Xem chi tiết</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUnmark(t)}>
                    <StarOff className="size-4" />
                    Bỏ đánh dấu mẫu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(t)}
                  >
                    <Trash2 className="size-4" />
                    Xóa mẫu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Link to={`/projects/${t.id}`} className="block">
            <p className="font-semibold leading-snug hover:text-primary line-clamp-2">
              {t.name.replace(/^\[MẪU\]\s*/i, '')}
            </p>
            {t.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {t.members.length} thành viên
            </Badge>
            <ProjectStatusBadge status={t.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProjectListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tab, setTab] = useState<'projects' | 'templates'>('projects')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const canManageProjects = useCanEdit('Projects')
  const { toast } = useToast()

  const statusParam = statusFilter === 'all' ? undefined : statusFilter

  const {
    data: projects = [],
    isLoading: loadingProjects,
    isError: errorProjects,
    refetch: refetchProjects,
  } = useProjects(search || undefined, statusParam, false)

  const {
    data: templates = [],
    isLoading: loadingTemplates,
    isError: errorTemplates,
    refetch: refetchTemplates,
  } = useProjects(undefined, undefined, true)

  const realTemplates = templates.filter((p) => p.isTemplate)

  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const markAsTemplate = useMarkProjectAsTemplate()

  const handleCreate = async (values: ProjectFormValues, files?: File[]): Promise<void> => {
    const created = await createProject.mutateAsync(values)
    if (files && files.length > 0 && created?.id) {
      await uploadProjectAttachments(created.id, files)
    }
  }

  const handleMarkTemplate = async (project: Project, isTemplate: boolean) => {
    await markAsTemplate.mutateAsync({ id: project.id, isTemplate })
    toast({
      title: isTemplate ? 'Đã lưu làm mẫu' : 'Đã bỏ đánh dấu mẫu',
      description: isTemplate
        ? `Dự án "${project.name}" sẽ xuất hiện trong danh sách mẫu.`
        : `Dự án "${project.name}" đã được chuyển về danh sách dự án thường.`,
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteProject.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
    toast({ title: 'Đã xóa dự án', description: deleteTarget.name })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dự án</h1>
          <p className="text-sm text-muted-foreground">Theo dõi dự án và tiến độ thực hiện</p>
        </div>
        {canManageProjects && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <Copy className="size-4" />
              Từ mẫu
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Tạo mới
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="projects" className="gap-1.5">
              <FolderKanban className="size-4" />
              Dự án
              {!loadingProjects && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                  {projects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <BookTemplate className="size-4" />
              Mẫu quy trình
              {!loadingTemplates && realTemplates.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                  {realTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {tab === 'projects' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm dự án..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8 w-[200px] sm:w-[260px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Planning">Lên kế hoạch</SelectItem>
                  <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                  <SelectItem value="OnHold">Tạm dừng</SelectItem>
                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                  <SelectItem value="Cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Projects tab */}
        <TabsContent value="projects" className="mt-3">
          <Card className="p-0">
            {errorProjects && <ErrorState onRetry={() => void refetchProjects()} />}

            {!loadingProjects && !errorProjects && projects.length === 0 && (
              <EmptyState
                icon={FolderKanban}
                title="Chưa có dự án nào"
                description={
                  canManageProjects
                    ? 'Tạo dự án đầu tiên hoặc khởi tạo từ mẫu quy trình có sẵn.'
                    : 'Hiện chưa có dự án nào được giao cho bạn.'
                }
                actionLabel={canManageProjects ? 'Tạo dự án' : undefined}
                onAction={canManageProjects ? () => setDialogOpen(true) : undefined}
              />
            )}

            {(loadingProjects || (!errorProjects && projects.length > 0)) && (
              <ProjectsTable
                projects={projects}
                isLoading={loadingProjects}
                canEdit={canManageProjects}
                onMarkTemplate={(p) => void handleMarkTemplate(p, true)}
                onDelete={(p) => setDeleteTarget(p)}
              />
            )}
          </Card>
        </TabsContent>

        {/* Templates tab */}
        <TabsContent value="templates" className="mt-3">
          <Card className="p-0">
            {errorTemplates && <ErrorState onRetry={() => void refetchTemplates()} />}

            {!errorTemplates && (
              <TemplatesSection
                templates={realTemplates}
                isLoading={loadingTemplates}
                canEdit={canManageProjects}
                onUnmark={(p) => void handleMarkTemplate(p, false)}
                onDelete={(p) => setDeleteTarget(p)}
                onCreateFromThis={() => setTemplateDialogOpen(true)}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
      <TemplatePickerDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa dự án</AlertDialogTitle>
            <AlertDialogDescription>
              Dự án <strong>{deleteTarget?.name}</strong> sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
