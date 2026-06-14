using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Queries.GetTasks;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTasksQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .Include(t => t.Assigner)
            .Include(t => t.Project)
            .Include(t => t.ParentTask)
            .Include(t => t.SubTasks)
            .AsQueryable();

        if (request.ProjectId is { } projectId)
        {
            query = query.Where(t => t.ProjectId == projectId);
        }

        if (request.ParentTaskId is { } parentTaskId)
        {
            query = query.Where(t => t.ParentTaskId == parentTaskId);
        }

        if (request.AssigneeId is { } assigneeId)
        {
            query = query.Where(t => t.AssigneeId == assigneeId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<WorkTaskStatus>(request.Status, out var status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(t => t.Title.Contains(term) || t.Code.Contains(term));
        }

        var tasks = await query.OrderByDescending(t => t.CreatedDate).ToListAsync(cancellationToken);
        return tasks.Select(t => t.ToDto()).ToList();
    }
}
