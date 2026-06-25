using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity.Authorization;

/// <summary>
/// Helper tĩnh tạo tên policy động dạng "Permission:{Module}:{Level}" dùng trong
/// <c>[Authorize(Policy = ...)]</c>, được <see cref="PermissionPolicyProvider"/> phân giải
/// thành <see cref="PermissionRequirement"/> tại runtime.
/// </summary>
public static class PermissionPolicies
{
    private const string Prefix = "Permission";

    /// <summary>Yêu cầu quyền Edit trên module - dùng cho các action POST/PUT/PATCH/DELETE.</summary>
    public static string Edit(PermissionModule module) => $"{Prefix}:{module}:{PermissionLevel.Edit}";

    /// <summary>Yêu cầu quyền View (hoặc Edit) trên module - dùng cho các action GET.</summary>
    public static string View(PermissionModule module) => $"{Prefix}:{module}:{PermissionLevel.View}";
}
