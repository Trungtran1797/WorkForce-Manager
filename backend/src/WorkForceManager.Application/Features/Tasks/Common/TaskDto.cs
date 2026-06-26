namespace WorkForceManager.Application.Features.Tasks.Common;

public record TaskAssigneeDto(int EmployeeId, string FullName);

public record TaskDto(
    int Id,
    string Code,
    string Title,
    string Description,
    int? AssigneeId,
    string AssigneeName,
    int? AssignerId,
    string AssignerName,
    string Priority,
    string Status,
    string StartDate,
    string DueDate,
    int Progress,
    int? ProjectId,
    string ProjectCode,
    int? ParentTaskId,
    string? ParentTaskTitle,
    int SubTaskCount,
    List<TaskAssigneeDto> Assignees);
