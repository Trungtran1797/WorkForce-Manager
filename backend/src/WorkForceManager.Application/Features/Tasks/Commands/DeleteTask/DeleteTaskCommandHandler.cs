using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Commands.DeleteTask;

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteTaskCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.Id);

        if (!TaskPermission.CanEdit(task, _currentUserService))
        {
            throw new ForbiddenAccessException("Bạn không có quyền xóa công việc này.");
        }

        // Retrieve all descendant tasks (subtasks of any depth)
        var allDescendantTasks = new List<WorkForceManager.Domain.Entities.TaskItem>();
        var tasksToProcess = new List<WorkForceManager.Domain.Entities.TaskItem> { task };

        while (tasksToProcess.Any())
        {
            var currentIds = tasksToProcess.Select(t => t.Id).ToList();
            var subTasks = await _context.Tasks
                .Where(t => t.ParentTaskId.HasValue && currentIds.Contains(t.ParentTaskId.Value))
                .ToListAsync(cancellationToken);

            allDescendantTasks.AddRange(subTasks);
            tasksToProcess = subTasks;
        }

        var allDeletedTaskIds = allDescendantTasks.Select(t => t.Id).Concat(new[] { task.Id }).ToList();

        var taskComments = await _context.TaskComments
            .Where(tc => allDeletedTaskIds.Contains(tc.TaskId))
            .ToListAsync(cancellationToken);

        var taskAttachments = await _context.TaskAttachments
            .Where(ta => allDeletedTaskIds.Contains(ta.TaskId))
            .ToListAsync(cancellationToken);

        _context.TaskComments.RemoveRange(taskComments);
        _context.TaskAttachments.RemoveRange(taskAttachments);
        _context.Tasks.RemoveRange(allDescendantTasks);
        _context.Tasks.Remove(task);

        if (task.ParentTaskId.HasValue)
        {
            await TaskProgressRecalculator.RecalculateParentAsync(_context, task.ParentTaskId.Value, cancellationToken, excludeTaskId: task.Id);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
