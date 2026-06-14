using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Queries.GetEmployees;

public class GetEmployeesQueryHandler : IRequestHandler<GetEmployeesQuery, PaginatedList<EmployeeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<EmployeeDto>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Employees
            .AsNoTracking()
            .Include(e => e.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(e =>
                e.FullName.Contains(term) ||
                e.EmployeeCode.Contains(term) ||
                e.Email.Contains(term));
        }

        if (request.DepartmentId is { } deptId)
        {
            query = query.Where(e => e.DepartmentId == deptId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<EmployeeStatus>(request.Status, out var status))
        {
            query = query.Where(e => e.Status == status);
        }

        query = ApplySorting(query, request.SortBy, request.IsDescending);

        var totalCount = await query.CountAsync(cancellationToken);
        var employees = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = employees.Select(e => e.ToDto()).ToList();
        return new PaginatedList<EmployeeDto>(items, totalCount, request.PageNumber, request.PageSize);
    }

    private static IQueryable<Employee> ApplySorting(IQueryable<Employee> query, string? sortBy, bool descending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "fullname" => descending ? query.OrderByDescending(e => e.FullName) : query.OrderBy(e => e.FullName),
            "employeecode" => descending ? query.OrderByDescending(e => e.EmployeeCode) : query.OrderBy(e => e.EmployeeCode),
            "hiredate" => descending ? query.OrderByDescending(e => e.HireDate) : query.OrderBy(e => e.HireDate),
            _ => descending ? query.OrderByDescending(e => e.CreatedDate) : query.OrderBy(e => e.CreatedDate),
        };
}
