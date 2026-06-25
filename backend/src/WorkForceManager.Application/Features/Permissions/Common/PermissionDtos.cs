namespace WorkForceManager.Application.Features.Permissions.Common;

/// <summary>Một dòng phân quyền theo Role x Module.</summary>
public record RolePermissionDto(string Role, string Module, string Level);

/// <summary>Một dòng quyền bổ sung theo Phòng ban x Module.</summary>
public record DepartmentPermissionOverrideDto(int DepartmentId, string DepartmentName, string Module, string Level);

/// <summary>Danh sách phòng ban tóm tắt - dùng để dựng grid Phòng ban x Module ở frontend.</summary>
public record DepartmentSummaryDto(int Id, string Name);

/// <summary>
/// Toàn bộ ma trận phân quyền hiện tại + catalog tĩnh (roles, modules, levels, departments)
/// để frontend dựng bảng Role x Module và Phòng ban x Module.
/// </summary>
public record PermissionMatrixDto(
    List<RolePermissionDto> RolePermissions,
    List<DepartmentPermissionOverrideDto> DepartmentOverrides,
    List<string> Roles,
    List<string> Modules,
    List<string> Levels,
    List<DepartmentSummaryDto> Departments);
