using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Permissions.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Permissions.Queries.GetPermissionMatrix;

public class GetPermissionMatrixQueryHandler : IRequestHandler<GetPermissionMatrixQuery, PermissionMatrixDto>
{
    private readonly IApplicationDbContext _context;

    public GetPermissionMatrixQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PermissionMatrixDto> Handle(GetPermissionMatrixQuery request, CancellationToken cancellationToken)
    {
        var rolePermissions = await _context.RolePermissions
            .AsNoTracking()
            .Select(rp => new RolePermissionDto(rp.Role.ToString(), rp.Module.ToString(), rp.Level.ToString()))
            .ToListAsync(cancellationToken);

        var departmentOverrides = await _context.DepartmentPermissionOverrides
            .AsNoTracking()
            .Include(o => o.Department)
            .Select(o => new DepartmentPermissionOverrideDto(
                o.DepartmentId, o.Department.Name, o.Module.ToString(), o.Level.ToString()))
            .ToListAsync(cancellationToken);

        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentSummaryDto(d.Id, d.Name))
            .ToListAsync(cancellationToken);

        var roles = Enum.GetNames<UserRole>().ToList();
        var modules = Enum.GetNames<PermissionModule>().ToList();
        var levels = Enum.GetNames<PermissionLevel>().ToList();

        return new PermissionMatrixDto(
            rolePermissions,
            departmentOverrides,
            roles,
            modules,
            levels,
            departments);
    }
}
