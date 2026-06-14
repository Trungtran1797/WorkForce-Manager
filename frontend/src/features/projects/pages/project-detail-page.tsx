import { useState } from "react";
import { ArrowLeft, Loader2, Plus, UserMinus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/data-state";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrencyVnd, formatDate } from "@/lib/formatters";
import { ProjectProgressBar } from "@/features/projects/components/project-progress-bar";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
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
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [memberRole, setMemberRole] = useState("");

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

  const handleAddMember = (): void => {
    if (!selectedEmployee) return;
    addMember.mutate(
      {
        id: project.id,
        employeeId: Number(selectedEmployee),
        role: memberRole || "Thành viên",
      },
      {
        onSuccess: () => {
          setMemberOpen(false);
          setSelectedEmployee("");
          setMemberRole("");
        },
      },
    );
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Ngày bắt đầu
                    </div>
                    <div className="text-sm font-medium">
                      {formatDate(project.startDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Ngày kết thúc
                    </div>
                    <div className="text-sm font-medium">
                      {formatDate(project.endDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Ngân sách
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrencyVnd(project.budget)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Mã dự án
                    </div>
                    <div className="text-sm font-medium">{project.code}</div>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="mb-2 text-sm font-medium">
                    Tiến độ tổng thể
                  </div>
                  <ProjectProgressBar
                    progress={project.progress}
                    status={project.status}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Nhân sự tham gia</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMemberOpen(true)}
                >
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
                  <ul className="space-y-3">
                    {project.members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback
                              className={cn(
                                AVATAR_COLOR_MAP[member.avatarColor],
                              )}
                            >
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {member.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Xóa khỏi dự án"
                          onClick={() =>
                            removeMember.mutate({
                              id: project.id,
                              memberId: member.id,
                            })
                          }
                        >
                          <UserMinus className="size-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Công việc của dự án</h2>
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

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán nhân sự vào dự án</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(
                    (e) => !project.members.some((m) => m.employeeId === e.id),
                  )
                  .map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Vai trò trong dự án (vd: Developer)"
              value={memberRole}
              onChange={(event) => setMemberRole(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedEmployee || addMember.isPending}
            >
              Gán nhân sự
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
