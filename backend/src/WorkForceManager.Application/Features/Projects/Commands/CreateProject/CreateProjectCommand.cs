using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.CreateProject;

public record CreateProjectCommand(
    string Code,
    string Name,
    string? Investor,
    string StartDate,
    string EndDate,
    string Status,
    decimal Budget,
    string? Description,
    int Progress,
    string? ShippingDate) : IRequest<ProjectDto>;
