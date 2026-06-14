using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Projects.Discussions.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectComments;

public class GetProjectCommentsQueryHandler : IRequestHandler<GetProjectCommentsQuery, ApiResponse<PaginatedList<ProjectCommentDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectCommentsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<PaginatedList<ProjectCommentDto>>> Handle(GetProjectCommentsQuery request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;
        var isMember = employeeId.HasValue && project.Members.Any(m => m.EmployeeId == employeeId.Value);

        if (!isMember && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không phải thành viên dự án này.");
        }

        var query = _context.ProjectComments
            .AsNoTracking()
            .Where(c => c.ProjectId == request.ProjectId)
            .Include(c => c.Author)
            .Include(c => c.Attachments)
            .ThenInclude(a => a.UploadedBy)
            .OrderByDescending(c => c.CreatedDate);

        var paged = await PaginatedList<Domain.Entities.ProjectComment>.CreateAsync(
            query, request.PageNumber, request.PageSize, cancellationToken);

        var items = paged.Items.Select(c => c.ToDto()).ToList();

        var result = new PaginatedList<ProjectCommentDto>(items, paged.TotalCount, paged.PageNumber, paged.PageSize);

        return ApiResponse<PaginatedList<ProjectCommentDto>>.Ok(result);
    }
}
