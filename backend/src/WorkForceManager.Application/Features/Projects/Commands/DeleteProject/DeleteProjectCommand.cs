using MediatR;

namespace WorkForceManager.Application.Features.Projects.Commands.DeleteProject;

public record DeleteProjectCommand(int Id) : IRequest<Unit>;
