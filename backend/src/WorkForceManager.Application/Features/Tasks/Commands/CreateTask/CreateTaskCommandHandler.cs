using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Commands.CreateTask;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public CreateTaskCommandHandler(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<TaskDto> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
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

        // Tự động sinh mã công việc
        string code;
        if (projectId.HasValue)
        {
            var projectCode = await _context.Projects
                .Where(p => p.Id == projectId.Value)
                .Select(p => p.Code)
                .FirstOrDefaultAsync(cancellationToken) ?? "00-000";

            if (request.ParentTaskId is { } pTaskId)
            {
                var parentTaskCode = await _context.Tasks
                    .Where(t => t.Id == pTaskId)
                    .Select(t => t.Code)
                    .FirstOrDefaultAsync(cancellationToken) ?? $"{projectCode}-00";

                var prefix = $"{parentTaskCode}-";
                var existingSubTaskCodes = await _context.Tasks
                    .Where(t => t.ParentTaskId == pTaskId && t.Code.StartsWith(prefix))
                    .Select(t => t.Code)
                    .ToListAsync(cancellationToken);

                int nextIndex = 1;
                if (existingSubTaskCodes.Any())
                {
                    var maxIndex = existingSubTaskCodes
                        .Select(c => c.Substring(prefix.Length))
                        .Select(s => int.TryParse(s, out var num) ? num : 0)
                        .Max();
                    nextIndex = maxIndex + 1;
                }
                code = $"{prefix}{nextIndex:D2}";
            }
            else
            {
                var prefix = $"{projectCode}-";
                var existingTaskCodes = await _context.Tasks
                    .Where(t => t.ProjectId == projectId.Value && t.ParentTaskId == null && t.Code.StartsWith(prefix))
                    .Select(t => t.Code)
                    .ToListAsync(cancellationToken);

                int nextIndex = 1;
                if (existingTaskCodes.Any())
                {
                    var maxIndex = existingTaskCodes
                        .Select(c => c.Substring(prefix.Length))
                        .Select(s => int.TryParse(s, out var num) ? num : 0)
                        .Max();
                    nextIndex = maxIndex + 1;
                }
                code = $"{prefix}{nextIndex:D2}";
            }
        }
        else
        {
            var yearSuffix = DateTime.Now.ToString("yy");
            var prefix = $"{yearSuffix}-TAS-";
            var existingTaskCodes = await _context.Tasks
                .Where(t => t.ProjectId == null && t.Code.StartsWith(prefix))
                .Select(t => t.Code)
                .ToListAsync(cancellationToken);

            int nextIndex = 1;
            if (existingTaskCodes.Any())
            {
                var maxIndex = existingTaskCodes
                    .Select(c => c.Substring(prefix.Length))
                    .Select(s => int.TryParse(s, out var num) ? num : 0)
                    .Max();
                nextIndex = maxIndex + 1;
            }
            code = $"{prefix}{nextIndex:D3}";
        }

        var task = new TaskItem
        {
            Code = code,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            AssigneeId = request.AssigneeId,
            AssignerId = request.AssignerId,
            Priority = Enum.Parse<TaskPriority>(request.Priority),
            Status = Enum.Parse<WorkTaskStatus>(request.Status),
            StartDate = ParseNullableDate(request.StartDate),
            DueDate = ParseNullableDate(request.DueDate),
            Progress = request.Progress,
            ProjectId = projectId,
            ParentTaskId = request.ParentTaskId
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);

        // Tạo TaskAssignee rows từ AssigneeIds (ưu tiên) hoặc fallback về AssigneeId đơn lẻ.
        var assigneeIds = (request.AssigneeIds?.Any() == true
            ? request.AssigneeIds
            : (request.AssigneeId.HasValue ? new List<int> { request.AssigneeId.Value } : new List<int>()))
            .Distinct()
            .ToList();

        foreach (var empId in assigneeIds)
        {
            _context.TaskAssignees.Add(new TaskAssignee { TaskId = task.Id, EmployeeId = empId });
        }

        if (assigneeIds.Any())
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (task.ParentTaskId.HasValue)
        {
            await TaskProgressRecalculator.RecalculateParentAsync(_context, task.ParentTaskId.Value, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Gửi thông báo đến tất cả người được giao việc.
        var notifyIds = assigneeIds.Any()
            ? assigneeIds
            : (task.AssigneeId.HasValue ? new List<int> { task.AssigneeId.Value } : new List<int>());

        foreach (var empId in notifyIds)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == empId, cancellationToken);
            if (user != null)
            {
                await _notificationService.SendNotificationToUserAsync(
                    user.Id,
                    "Công việc mới",
                    $"Bạn được giao công việc: \"{task.Title}\"",
                    "task",
                    $"/tasks?search={task.Code}",
                    cancellationToken);
            }
        }

        var created = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .Include(t => t.Assigner)
            .Include(t => t.Project)
            .Include(t => t.ParentTask)
            .Include(t => t.SubTasks)
            .Include(t => t.Assignees).ThenInclude(a => a.Employee)
            .FirstAsync(t => t.Id == task.Id, cancellationToken);

        return created.ToDto();
    }

    private static DateTime? ParseNullableDate(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : DateTime.Parse(value);
}
