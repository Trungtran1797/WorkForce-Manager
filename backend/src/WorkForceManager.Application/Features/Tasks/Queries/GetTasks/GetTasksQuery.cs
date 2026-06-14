using MediatR;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Queries.GetTasks;

public record GetTasksQuery(
    int? ProjectId,
    int? AssigneeId,
    string? Status,
    string? Search,
    int? ParentTaskId) : IRequest<List<TaskDto>>;
