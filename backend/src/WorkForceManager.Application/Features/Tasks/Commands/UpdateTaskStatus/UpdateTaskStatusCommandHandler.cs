using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler : IRequestHandler<UpdateTaskStatusCommand, TaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTaskStatusCommandHandler(
        IApplicationDbContext context,
        INotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    public async Task<TaskDto> Handle(UpdateTaskStatusCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<WorkTaskStatus>(request.Status, out var status))
        {
            throw new ConflictException("Trạng thái không hợp lệ.");
        }

        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.Id);

        if (!TaskPermission.CanEdit(task, _currentUserService))
        {
            throw new ForbiddenAccessException("Bạn không có quyền chỉnh sửa công việc này.");
        }

        task.Status = status;

        // Tự động đồng bộ % hoàn thành theo trạng thái nếu client không truyền.
        task.Progress = request.Progress ?? status switch
        {
            WorkTaskStatus.Done => 100,
            WorkTaskStatus.Todo => 0,
            _ => task.Progress
        };

        if (task.ParentTaskId.HasValue)
        {
            await TaskProgressRecalculator.RecalculateParentAsync(_context, task.ParentTaskId.Value, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var updated = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .Include(t => t.Assigner)
            .Include(t => t.Project)
            .FirstAsync(t => t.Id == task.Id, cancellationToken);

        // Gửi thông báo đến người giao việc khi công việc hoàn thành
        if (status == WorkTaskStatus.Done && task.AssignerId.HasValue)
        {
            var assignerUser = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == task.AssignerId.Value, cancellationToken);
            if (assignerUser != null)
            {
                var assigneeName = updated.Assignee?.FullName ?? "Nhân viên";
                await _notificationService.SendNotificationToUserAsync(
                    assignerUser.Id,
                    "Công việc hoàn thành",
                    $"{assigneeName} đã hoàn thành công việc: \"{task.Title}\"",
                    "task",
                    $"/tasks?search={task.Code}",
                    cancellationToken);
            }
        }

        return updated.ToDto();
    }
}
