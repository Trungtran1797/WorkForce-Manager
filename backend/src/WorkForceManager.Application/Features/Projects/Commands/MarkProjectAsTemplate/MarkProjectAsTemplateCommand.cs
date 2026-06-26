using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.MarkProjectAsTemplate;

public record MarkProjectAsTemplateCommand(int Id, bool IsTemplate) : IRequest<ProjectDto>;
