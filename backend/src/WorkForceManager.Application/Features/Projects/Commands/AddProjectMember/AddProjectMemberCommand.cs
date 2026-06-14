using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.AddProjectMember;

public record AddProjectMemberCommand(int ProjectId, int EmployeeId, string Role) : IRequest<ProjectDto>;
