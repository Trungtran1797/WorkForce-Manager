using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Queries.GetProjects;

public record GetProjectsQuery(string? Search, string? Status, bool IncludeTemplates = false) : IRequest<List<ProjectDto>>;
