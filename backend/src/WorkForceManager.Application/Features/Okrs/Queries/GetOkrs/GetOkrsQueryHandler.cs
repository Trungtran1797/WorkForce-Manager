using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Okrs.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Okrs.Queries.GetOkrs;

public class GetOkrsQueryHandler : IRequestHandler<GetOkrsQuery, List<OkrObjectiveDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOkrsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OkrObjectiveDto>> Handle(GetOkrsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.OkrObjectives
            .AsNoTracking()
            .Include(o => o.Department)
            .Include(o => o.Employee)
            .Include(o => o.KeyResults)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Period))
        {
            query = query.Where(o => o.Period == request.Period);
        }

        if (request.DepartmentId is { } departmentId)
        {
            query = query.Where(o => o.DepartmentId == departmentId);
        }

        if (request.EmployeeId is { } employeeId)
        {
            query = query.Where(o => o.EmployeeId == employeeId);
        }

        if (!string.IsNullOrWhiteSpace(request.OwnerType) && Enum.TryParse<OkrOwnerType>(request.OwnerType, out var ownerType))
        {
            query = query.Where(o => o.OwnerType == ownerType);
        }

        var items = await query
            .OrderByDescending(o => o.Period)
            .ThenBy(o => o.Title)
            .ToListAsync(cancellationToken);

        return items.Select(o => o.ToDto()).ToList();
    }
}
