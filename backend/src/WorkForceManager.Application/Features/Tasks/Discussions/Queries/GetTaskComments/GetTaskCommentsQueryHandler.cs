using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Tasks.Discussions.Common;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskComments;

public class GetTaskCommentsQueryHandler : IRequestHandler<GetTaskCommentsQuery, ApiResponse<PaginatedList<TaskCommentDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTaskCommentsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<PaginatedList<TaskCommentDto>>> Handle(GetTaskCommentsQuery request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
            .ThenInclude(p => p!.Members)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.TaskId);

        var employeeId = _currentUserService.EmployeeId;

        if (!TaskDiscussionAccess.CanAccess(task, employeeId, _currentUserService.Role))
        {
            throw new ForbiddenAccessException("Bạn không có quyền xem thảo luận của công việc này.");
        }

        var query = _context.TaskComments
            .AsNoTracking()
            .Where(c => c.TaskId == request.TaskId)
            .Include(c => c.Author)
            .Include(c => c.Attachments)
            .ThenInclude(a => a.UploadedBy)
            .OrderByDescending(c => c.CreatedDate);

        var paged = await PaginatedList<Domain.Entities.TaskComment>.CreateAsync(
            query, request.PageNumber, request.PageSize, cancellationToken);

        var items = paged.Items.Select(c => c.ToDto()).ToList();

        var result = new PaginatedList<TaskCommentDto>(items, paged.TotalCount, paged.PageNumber, paged.PageSize);

        return ApiResponse<PaginatedList<TaskCommentDto>>.Ok(result);
    }
}
