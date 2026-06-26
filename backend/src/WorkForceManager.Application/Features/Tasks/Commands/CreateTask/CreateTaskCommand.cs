using MediatR;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Commands.CreateTask;

public record CreateTaskCommand(
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
