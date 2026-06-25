using MediatR;
using WorkForceManager.Application.Features.Permissions.Common;

namespace WorkForceManager.Application.Features.Permissions.Commands.UpdatePermissionMatrix;

/// <summary>
/// Cập nhật toàn bộ ma trận phân quyền: upsert RolePermissions theo (Role, Module) và
/// thay thế toàn bộ DepartmentPermissionOverrides theo danh sách truyền vào (full replace).
/// </summary>
public record UpdatePermissionMatrixCommand(
    List<RolePermissionDto> RolePermissions,
    List<DepartmentPermissionOverrideDto> DepartmentOverrides) : IRequest<Unit>;
