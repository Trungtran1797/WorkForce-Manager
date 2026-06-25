using Microsoft.AspNetCore.Authorization;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity;

/// <summary>
/// Định nghĩa tập trung tên policy và rule role (security-rules.md).
/// Các policy theo module (CRUD Employees/Projects/Shifts/Overtime/Payroll/Performance...) đã
/// được thay thế bằng ma trận phân quyền động (xem
/// <see cref="WorkForceManager.Infrastructure.Identity.Authorization.PermissionPolicies"/>).
/// Hai policy dưới đây chỉ còn dùng cho các action KHÔNG gắn với 1 module dữ liệu cụ thể
/// (vd. quản lý tài khoản người dùng, ma trận phân quyền).
/// </summary>
public static class AuthorizationPolicies
{
    public const string RequireSuperAdmin = nameof(RequireSuperAdmin);
    public const string RequireManager = nameof(RequireManager);

    public static void Register(AuthorizationOptions options)
    {
        options.AddPolicy(RequireSuperAdmin, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin)));

        options.AddPolicy(RequireManager, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));
    }
}
