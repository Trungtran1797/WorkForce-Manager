using MediatR;
using WorkForceManager.Application.Features.Permissions.Common;

namespace WorkForceManager.Application.Features.Permissions.Queries.GetPermissionMatrix;

/// <summary>Lấy toàn bộ ma trận phân quyền (RolePermissions + DepartmentPermissionOverrides) + catalog tĩnh.</summary>
public record GetPermissionMatrixQuery : IRequest<PermissionMatrixDto>;
