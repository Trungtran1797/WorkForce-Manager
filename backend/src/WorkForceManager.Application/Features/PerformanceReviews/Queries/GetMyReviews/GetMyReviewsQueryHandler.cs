using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.PerformanceReviews.Common;

namespace WorkForceManager.Application.Features.PerformanceReviews.Queries.GetMyReviews;

public class GetMyReviewsQueryHandler : IRequestHandler<GetMyReviewsQuery, List<PerformanceReviewDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyReviewsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<PerformanceReviewDto>> Handle(GetMyReviewsQuery request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null or 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var reviews = await _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Criteria)
            .Where(r => r.EmployeeId == employeeId)
            .OrderByDescending(r => r.Period)
            .ThenByDescending(r => r.Id)
            .ToListAsync(cancellationToken);

        return reviews.Select(r => r.ToDto()).ToList();
    }
}
