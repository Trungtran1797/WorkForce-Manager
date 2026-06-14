using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Departments.Common;

namespace WorkForceManager.Application.Features.Departments.Queries.GetDepartments;

public class GetDepartmentsQueryHandler : IRequestHandler<GetDepartmentsQuery, List<DepartmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentDto>> Handle(GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Departments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(d => d.Name.Contains(term));
        }

        return await query
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(
                d.Id,
                d.Name,
                d.ManagerId,
                d.Manager != null ? d.Manager.FullName : string.Empty,
                d.Employees.Count(e => !e.IsDeleted),
                d.Description ?? string.Empty,
                d.Icon,
                d.ColorVariant,
                d.ParentDepartmentId,
                d.ParentDepartment != null ? d.ParentDepartment.Name : null))
            .ToListAsync(cancellationToken);
    }
}
