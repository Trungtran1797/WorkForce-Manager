import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Truck, UserMinus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/data-state";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrencyVnd, formatDate } from "@/lib/formatters";
import { ProjectProgressBar } from "@/features/projects/components/project-progress-bar";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { AddMemberDialog } from "@/features/projects/components/add-member-dialog";
import { CommentForm } from "@/features/projects/components/comment-form";
import { ProjectGeneralFeed } from "@/features/projects/components/project-general-feed";
import { TaskListView } from "@/features/tasks/components/task-list-view";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { useCreateTask, useTasks } from "@/features/tasks/api/task-queries";
import {
  useAddProjectMember,
  useProject,
  useRemoveProjectMember,
  useUpdateProject,
  useDeleteProject,
} from "@/features/projects/api/project-queries";
import { useEmployees } from "@/features/employees/api/employee-queries";
import type {
  ProjectFormValues,
  ProjectMember,
} from "@/features/projects/types";
import type { TaskFormValues } from "@/features/tasks/types";

const AVATAR_COLOR_MAP: Record<ProjectMember["avatarColor"], string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  gray: "bg-muted text-muted-foreground",
};

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const id = Number(projectId);

  const { data: project, isLoading, isError, refetch } = useProject(id);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const { data: employeesPage } = useEmployees({
    pageNumber: 1,
    pageSize: 100,
  });
  const employees = employeesPage?.items ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  const {
    data: projectTasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useTasks({ projectId: id });
  const createTask = useCreateTask();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <Card className="p-0">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              title="Không tìm thấy dự án"
              description="Dự án này có thể đã bị xóa hoặc không tồn tại."
              actionLabel="Về danh sách dự án"
              onAction={() => navigate("/projects")}
            />
          )}
        </Card>
      </div>
    );
  }

  const handleUpdate = async (values: ProjectFormValues): Promise<void> => {
    await updateProject.mutateAsync({ id: project.id, values });
  };

  const handleDeleteProject = async (): Promise<void> => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này? Toàn bộ công việc liên quan cũng sẽ bị ảnh hưởng.")) {
      try {
        await deleteProject.mutateAsync(project.id);
        navigate("/projects");
      } catch (error) {
        alert(error instanceof Error ? error.message : "Xóa dự án thất bại.");
      }
    }
  };

  const handleCreateTask = async (values: TaskFormValues): Promise<void> => {
    await createTask.mutateAsync(values);
  };

  const handleAddMembers = async (
    selections: { employeeId: number; role: string }[]
  ): Promise<void> => {
    setMemberSubmitting(true);
    try {
      for (const sel of selections) {
        await addMember.mutateAsync({ id: project.id, ...sel });
      }
    } finally {
      setMemberSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/projects">
          <ArrowLeft className="size-4" />
          Quay lại danh sách dự án
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {project.code} - {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Chủ đầu tư: {project.investor || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Sửa thông tin dự án
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteProject}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? "Đang xóa..." : "Xóa dự án"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="discussion">Thảo luận chung</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Row 1: 3 cards ngang */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Card 1: Thông tin dự án – compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông tin dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Ngày bắt đầu</div>
                    <div className="font-medium">{formatDate(project.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ngày kết thúc</div>
                    <div className="font-medium">{formatDate(project.endDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ngân sách</div>
                    <div className="font-medium">{formatCurrencyVnd(project.budget)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Số hợp đồng</div>
                    <div className="font-medium">{project.code}</div>
                  </div>
                  {project.shippingDate && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="size-3 text-orange-500" />
                        Ngày xuất hàng
                      </div>
                      <div className="font-medium text-orange-600">{formatDate(project.shippingDate)}</div>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">Tiến độ tổng thể</div>
                  <ProjectProgressBar progress={project.progress} status={project.status} />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Mô tả dự án */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mô tả dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.description || "—"}
                </p>
                <Separator />
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Chủ đầu tư: </span>
                  <span className="font-medium">{project.investor || "—"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Nhân sự tham gia */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Nhân sự tham gia</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setMemberOpen(true)}>
                  <Plus className="size-4" />
                  Gán nhân sự
                </Button>
              </CardHeader>
              <CardContent>
                {project.members.length === 0 ? (
                  <EmptyState
                    title="Chưa có nhân sự"
                    description="Gán nhân sự vào dự án để bắt đầu phân công công việc."
                  />
                ) : (
                  <ul className="space-y-2">
                    {project.members.map((member) => (
                      <li key={member.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback className={cn("text-xs", AVATAR_COLOR_MAP[member.avatarColor])}>
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium leading-tight">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.role}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          aria-label="Xóa khỏi dự án"
                          onClick={() => removeMember.mutate({ id: project.id, memberId: member.id })}
                        >
                          <UserMinus className="size-3.5 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Công việc dự án – full width */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Công việc dự án</h2>
              <Button size="sm" onClick={() => setTaskOpen(true)}>
                <Plus className="size-4" />
                Thêm công việc
              </Button>
            </div>
            {tasksLoading ? (
              <Card className="p-0">
                <TableSkeleton rows={4} columns={8} />
              </Card>
            ) : tasksError ? (
              <Card className="p-0">
                <ErrorState onRetry={() => void refetchTasks()} />
              </Card>
            ) : (
              <TaskListView tasks={projectTasks} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Thảo luận chung
                <span className="text-xs font-normal text-muted-foreground">
                  — tổng hợp bình luận từ dự án và tất cả công việc
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CommentForm projectId={project.id} />
            </CardContent>
          </Card>
          <ProjectGeneralFeed
            projectId={project.id}
            projectCode={project.code}
            tasks={projectTasks}
          />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSubmit={handleUpdate}
      />

      <TaskFormDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        defaultProjectId={project.id}
        onSubmit={handleCreateTask}
      />

      <AddMemberDialog
        open={memberOpen}
        onOpenChange={setMemberOpen}
        employees={employees}
        existingMembers={project.members}
        isSubmitting={memberSubmitting}
        onAdd={handleAddMembers}
      />
    </div>
  );
}
