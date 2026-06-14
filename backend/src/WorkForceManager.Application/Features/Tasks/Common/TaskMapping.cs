using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Tasks.Common;

public static class TaskMapping
{
    private const string DateFormat = "yyyy-MM-dd";

    public static TaskDto ToDto(this TaskItem t) => new(
        t.Id,
        t.Code,
        t.Title,
        t.Description ?? string.Empty,
        t.AssigneeId,
        t.Assignee?.FullName ?? string.Empty,
        t.AssignerId,
        t.Assigner?.FullName ?? string.Empty,
        t.Priority.ToString(),
        t.Status.ToString(),
        t.StartDate?.ToString(DateFormat) ?? string.Empty,
        t.DueDate?.ToString(DateFormat) ?? string.Empty,
        t.Progress,
        t.ProjectId,
        t.Project?.Code ?? string.Empty,
        t.ParentTaskId,
        t.ParentTask?.Title,
        t.SubTasks.Count(st => !st.IsDeleted));
}
