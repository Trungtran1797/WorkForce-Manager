using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>
/// Cung cấp quyền hiệu lực (effective permission) theo Role + Phòng ban cho từng Module,
/// effective = max(RolePermission.Level, DepartmentPermissionOverride.Level).
/// Implementation (Infrastructure) có cache để tránh truy vấn DB lặp lại.
/// </summary>
public interface IPermissionService
{
    /// <summary>Trả về quyền hiệu lực cho toàn bộ 20 module của 1 Role + Phòng ban (nếu có).</summary>
    Task<Dictionary<PermissionModule, PermissionLevel>> GetEffectivePermissionsAsync(
        UserRole role, int? departmentId, CancellationToken cancellationToken);

    /// <summary>Trả về quyền hiệu lực cho 1 module cụ thể.</summary>
    Task<PermissionLevel> GetEffectiveLevelAsync(
        UserRole role, int? departmentId, PermissionModule module, CancellationToken cancellationToken);

    /// <summary>Xóa toàn bộ cache (gọi sau khi Super Admin cập nhật ma trận phân quyền).</summary>
    void InvalidateCache();
}
