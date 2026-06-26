using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Queries.GetProjectTemplates;

public record GetProjectTemplatesQuery : IRequest<List<ProjectTemplateDto>>;
