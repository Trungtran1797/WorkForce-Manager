using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.CreateProjectFromTemplate;

public record CreateProjectFromTemplateCommand : IRequest<ProjectDto>
{
    public int TemplateId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Investor { get; init; }
    public string StartDate { get; init; } = string.Empty;
    public decimal Budget { get; init; }
    public string? Description { get; init; }
    public string? Code { get; init; }
    public string? ShippingDate { get; init; }
    public string? EndDate { get; init; }
}
