using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.UpdateProject;

public record UpdateProjectCommand(
    int Id,
    string Code,
    string Name,
    string? Investor,
    string StartDate,
    string EndDate,
    string Status,
    decimal Budget,
    string? Description,
    int Progress) : IRequest<ProjectDto>;
