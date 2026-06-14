using MediatR;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.RemoveProjectMember;

public record RemoveProjectMemberCommand(int ProjectId, int MemberId) : IRequest<ProjectDto>;
