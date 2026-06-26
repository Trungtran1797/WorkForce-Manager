using MediatR;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Commands.UpdateTask;

public record UpdateTaskCommand(
    int Id,
    string Code,
    string Title,
    string? Description,
    int? AssigneeId,
    int? AssignerId,
    string Priority,
    string Status,
    string? StartDate,
    string? DueDate,
    int Progress,
    int? ProjectId,
    int? ParentTaskId,
    List<int>? AssigneeIds) : IRequest<TaskDto>;
