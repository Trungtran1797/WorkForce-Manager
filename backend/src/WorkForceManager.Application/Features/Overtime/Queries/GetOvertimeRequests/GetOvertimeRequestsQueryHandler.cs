using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Overtime.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Overtime.Queries.GetOvertimeRequests;

public class GetOvertimeRequestsQueryHandler : IRequestHandler<GetOvertimeRequestsQuery, PaginatedList<OvertimeRequestDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOvertimeRequestsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<OvertimeRequestDto>> Handle(GetOvertimeRequestsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.OvertimeRequests
            .AsNoTracking()
            .Include(o => o.Employee)
                .ThenInclude(e => e!.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(o => o.Employee!.FullName.Contains(term) || o.Employee.EmployeeCode.Contains(term));
        }

        if (request.DepartmentId is { } deptId)
        {
            query = query.Where(o => o.Employee!.DepartmentId == deptId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<OvertimeStatus>(request.Status, out var status))
        {
            query = query.Where(o => o.Status == status);
        }

        query = query.OrderByDescending(o => o.Date).ThenByDescending(o => o.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<OvertimeRequestDto>(
            items.Select(o => o.ToDto()).ToList(), totalCount, request.PageNumber, request.PageSize);
    }
}
