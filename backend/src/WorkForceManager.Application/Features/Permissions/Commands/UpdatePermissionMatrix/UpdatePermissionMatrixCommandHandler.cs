using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Permissions.Commands.UpdatePermissionMatrix;

public class UpdatePermissionMatrixCommandHandler : IRequestHandler<UpdatePermissionMatrixCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IPermissionService _permissionService;

    public UpdatePermissionMatrixCommandHandler(IApplicationDbContext context, IPermissionService permissionService)
    {
        _context = context;
        _permissionService = permissionService;
    }

    public async Task<Unit> Handle(UpdatePermissionMatrixCommand request, CancellationToken cancellationToken)
    {
        var existingRolePermissions = await _context.RolePermissions.ToListAsync(cancellationToken);

        foreach (var input in request.RolePermissions)
        {
            var role = Enum.Parse<UserRole>(input.Role);
            var module = Enum.Parse<PermissionModule>(input.Module);
            var level = Enum.Parse<PermissionLevel>(input.Level);

            var existing = existingRolePermissions.FirstOrDefault(rp => rp.Role == role && rp.Module == module);
            if (existing is not null)
            {
                existing.Level = level;
            }
            else
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    Role = role,
                    Module = module,
                    Level = level
                });
            }
        }

        var existingOverrides = await _context.DepartmentPermissionOverrides.ToListAsync(cancellationToken);

        var requestedKeys = request.DepartmentOverrides
            .Select(o => (DepartmentId: o.DepartmentId, Module: Enum.Parse<PermissionModule>(o.Module)))
            .ToHashSet();

        var toRemove = existingOverrides
            .Where(o => !requestedKeys.Contains((o.DepartmentId, o.Module)))
            .ToList();

        foreach (var entity in toRemove)
        {
            _context.DepartmentPermissionOverrides.Remove(entity);
        }

        foreach (var input in request.DepartmentOverrides)
        {
            var module = Enum.Parse<PermissionModule>(input.Module);
            var level = Enum.Parse<PermissionLevel>(input.Level);

            var existing = existingOverrides.FirstOrDefault(o => o.DepartmentId == input.DepartmentId && o.Module == module);
            if (existing is not null)
            {
                existing.Level = level;
            }
            else
            {
                _context.DepartmentPermissionOverrides.Add(new DepartmentPermissionOverride
                {
                    DepartmentId = input.DepartmentId,
                    Module = module,
                    Level = level
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _permissionService.InvalidateCache();

        return Unit.Value;
    }
}
