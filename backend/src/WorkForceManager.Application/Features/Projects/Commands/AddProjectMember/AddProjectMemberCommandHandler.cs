using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Projects.Commands.AddProjectMember;

public class AddProjectMemberCommandHandler : IRequestHandler<AddProjectMemberCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public AddProjectMemberCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(AddProjectMemberCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Members)
            .ThenInclude(m => m.Employee)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        if (!await _context.Employees.AnyAsync(e => e.Id == request.EmployeeId, cancellationToken))
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        if (project.Members.Any(m => m.EmployeeId == request.EmployeeId))
        {
            throw new ConflictException("Nhân viên đã là thành viên dự án.");
        }

        var employee = await _context.Employees.FirstAsync(e => e.Id == request.EmployeeId, cancellationToken);
        var member = new ProjectMember
        {
            ProjectId = request.ProjectId,
            EmployeeId = request.EmployeeId,
            RoleInProject = string.IsNullOrWhiteSpace(request.Role) ? "Thành viên" : request.Role.Trim(),
            JoinedDate = DateTime.UtcNow,
            Employee = employee
        };
        project.Members.Add(member);

        await _context.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }
}
