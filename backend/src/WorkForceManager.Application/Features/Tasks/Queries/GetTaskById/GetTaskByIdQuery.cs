using MediatR;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Queries.GetTaskById;

public record GetTaskByIdQuery(int Id) : IRequest<TaskDto>;
