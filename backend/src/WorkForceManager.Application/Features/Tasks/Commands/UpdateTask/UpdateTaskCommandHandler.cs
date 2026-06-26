using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Commands.UpdateTask;

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTaskCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TaskDto> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.Id);

        if (!TaskPermission.CanEdit(task, _currentUserService))
        {
            throw new ForbiddenAccessException("Bạn không có quyền chỉnh sửa công việc này.");
        }

        var oldParentTaskId = task.ParentTaskId;

        // Mã công việc là bất biến, không cho phép chỉnh sửa sau khi tạo.

        var projectId = request.ProjectId;

        // Nếu là subtask và chưa chỉ định ProjectId, kế thừa ProjectId từ task cha.
        if (request.ParentTaskId is { } parentTaskId)
        {
            var parentProjectId = await _context.Tasks
                .Where(t => t.Id == parentTaskId)
                .Select(t => t.ProjectId)
                .FirstOrDefaultAsync(cancellationToken);

            if (projectId is null)
            {
                projectId = parentProjectId;
            }
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.AssigneeId = request.AssigneeId;
        task.AssignerId = request.AssignerId;
        task.Priority = Enum.Parse<TaskPriority>(request.Priority);
        task.Status = Enum.Parse<WorkTaskStatus>(request.Status);
        task.StartDate = string.IsNullOrWhiteSpace(request.StartDate) ? null : DateTime.Parse(request.StartDate);
        task.DueDate = string.IsNullOrWhiteSpace(request.DueDate) ? null : DateTime.Parse(request.DueDate);
        task.Progress = request.Progress;
        task.ProjectId = projectId;
        task.ParentTaskId = request.ParentTaskId;

        if (task.ParentTaskId.HasValue)
        {
            await TaskProgressRecalculator.RecalculateParentAsync(_context, task.ParentTaskId.Value, cancellationToken);
        }

        if (oldParentTaskId.HasValue && oldParentTaskId != task.ParentTaskId)
        {
            await TaskProgressRecalculator.RecalculateParentAsync(_context, oldParentTaskId.Value, cancellationToken, excludeTaskId: task.Id);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Sync assignees: tính tập mới từ AssigneeIds (ưu tiên) hoặc fallback về AssigneeId đơn lẻ.
        var newIds = (request.AssigneeIds?.Any() == true
            ? request.AssigneeIds
            : (request.AssigneeId.HasValue ? new List<int> { request.AssigneeId.Value } : new List<int>()))
            .Distinct()
            .ToHashSet();

        var existingAssignees = await _context.TaskAssignees
            .Where(ta => ta.TaskId == task.Id)
            .ToListAsync(cancellationToken);

        var existingIds = existingAssignees.Select(a => a.EmployeeId).ToHashSet();

        foreach (var toRemove in existingAssignees.Where(a => !newIds.Contains(a.EmployeeId)))
            _context.TaskAssignees.Remove(toRemove);

        foreach (var toAdd in newIds.Where(id => !existingIds.Contains(id)))
            _context.TaskAssignees.Add(new TaskAssignee { TaskId = task.Id, EmployeeId = toAdd });

        await _context.SaveChangesAsync(cancellationToken);

        var updated = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .Include(t => t.Assigner)
            .Include(t => t.Project)
            .Include(t => t.ParentTask)
            .Include(t => t.SubTasks)
            .Include(t => t.Assignees).ThenInclude(a => a.Employee)
            .FirstAsync(t => t.Id == task.Id, cancellationToken);

        return updated.ToDto();
    }
}
