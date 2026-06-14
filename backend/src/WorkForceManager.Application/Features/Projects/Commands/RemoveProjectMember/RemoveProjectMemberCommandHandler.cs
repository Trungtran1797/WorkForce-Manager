using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.RemoveProjectMember;

public class RemoveProjectMemberCommandHandler : IRequestHandler<RemoveProjectMemberCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public RemoveProjectMemberCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(RemoveProjectMemberCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Members)
            .ThenInclude(m => m.Employee)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        var member = project.Members.FirstOrDefault(m => m.Id == request.MemberId)
            ?? throw new NotFoundException("Thành viên dự án", request.MemberId);

        _context.ProjectMembers.Remove(member);
        project.Members.Remove(member);

        await _context.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }
}
