using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Queries.GetProjectById;

public record GetProjectByIdQuery(int Id) : IRequest<ProjectDto>;
