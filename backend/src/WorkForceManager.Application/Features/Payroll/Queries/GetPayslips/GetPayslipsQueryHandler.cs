using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Payroll.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Payroll.Queries.GetPayslips;

public class GetPayslipsQueryHandler : IRequestHandler<GetPayslipsQuery, PaginatedList<PayslipDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPayslipsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<PayslipDto>> Handle(GetPayslipsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Payslips
            .AsNoTracking()
            .Include(p => p.Items)
            .Include(p => p.Employee)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Period))
        {
            query = query.Where(p => p.Period == request.Period);
        }

        if (request.DepartmentId is { } deptId)
        {
            query = query.Where(p => p.Employee!.DepartmentId == deptId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<PayslipStatus>(request.Status, out var status))
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(p => p.Employee!.FullName.Contains(term) || p.Employee.EmployeeCode.Contains(term));
        }

        query = query.OrderByDescending(p => p.Period).ThenBy(p => p.Employee!.FullName);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<PayslipDto>(
            items.Select(p => p.ToDto()).ToList(), totalCount, request.PageNumber, request.PageSize);
    }
}
