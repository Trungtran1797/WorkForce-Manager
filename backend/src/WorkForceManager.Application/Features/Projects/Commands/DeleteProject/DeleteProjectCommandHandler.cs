using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Projects.Commands.DeleteProject;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteProjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.Id);

        var projectMembers = await _context.ProjectMembers
            .Where(pm => pm.ProjectId == request.Id)
            .ToListAsync(cancellationToken);

        var projectComments = await _context.ProjectComments
            .Where(pc => pc.ProjectId == request.Id)
            .ToListAsync(cancellationToken);

        var projectAttachments = await _context.ProjectAttachments
            .Where(pa => pa.ProjectId == request.Id)
            .ToListAsync(cancellationToken);

        var projectTasks = await _context.Tasks
            .Where(t => t.ProjectId == request.Id)
            .ToListAsync(cancellationToken);

        var taskIds = projectTasks.Select(t => t.Id).ToList();

        var taskComments = await _context.TaskComments
            .Where(tc => taskIds.Contains(tc.TaskId))
            .ToListAsync(cancellationToken);

        var taskAttachments = await _context.TaskAttachments
            .Where(ta => taskIds.Contains(ta.TaskId))
            .ToListAsync(cancellationToken);

        _context.TaskComments.RemoveRange(taskComments);
        _context.TaskAttachments.RemoveRange(taskAttachments);
        _context.Tasks.RemoveRange(projectTasks);
        _context.ProjectMembers.RemoveRange(projectMembers);
        _context.ProjectComments.RemoveRange(projectComments);
        _context.ProjectAttachments.RemoveRange(projectAttachments);
        _context.Projects.Remove(project);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
