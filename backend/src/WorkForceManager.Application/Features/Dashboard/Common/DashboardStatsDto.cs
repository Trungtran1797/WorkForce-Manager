namespace WorkForceManager.Application.Features.Dashboard.Common;

public record DashboardStatsDto(
    int TotalEmployees,
    string TotalEmployeesHelper,
    string TotalEmployeesVariant,
    int ActiveTasks,
    string ActiveTasksHelper,
    string ActiveTasksVariant,
    int OverdueTasks,
    string OverdueTasksHelper,
    string OverdueTasksVariant,
    int ActiveProjects,
    string ActiveProjectsHelper,
    string ActiveProjectsVariant,
    int CompletedTasks,
    string CompletedTasksHelper,
    string CompletedTasksVariant);
