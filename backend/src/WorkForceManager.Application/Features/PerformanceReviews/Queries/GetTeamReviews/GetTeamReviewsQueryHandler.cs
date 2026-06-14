using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.PerformanceReviews.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.PerformanceReviews.Queries.GetTeamReviews;

public class GetTeamReviewsQueryHandler : IRequestHandler<GetTeamReviewsQuery, PaginatedList<PerformanceReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTeamReviewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<PerformanceReviewDto>> Handle(GetTeamReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Criteria)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(r => r.Employee!.FullName.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.Period))
        {
            query = query.Where(r => r.Period == request.Period);
        }

        if (request.DepartmentId is { } departmentId)
        {
            query = query.Where(r => r.Employee!.DepartmentId == departmentId);
        }

        if (request.EmployeeId is { } employeeId)
        {
            query = query.Where(r => r.EmployeeId == employeeId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<ReviewStatus>(request.Status, out var status))
        {
            query = query.Where(r => r.Status == status);
        }

        query = query.OrderByDescending(r => r.Period).ThenByDescending(r => r.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<PerformanceReviewDto>(
            items.Select(r => r.ToDto()).ToList(), totalCount, request.PageNumber, request.PageSize);
    }
}
