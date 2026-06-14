using MediatR;

namespace WorkForceManager.Application.Features.Tasks.Commands.DeleteTask;

public record DeleteTaskCommand(int Id) : IRequest<Unit>;
