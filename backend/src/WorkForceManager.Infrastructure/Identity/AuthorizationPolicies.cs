using Microsoft.AspNetCore.Authorization;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity;

/// <summary>Định nghĩa tập trung tên policy và rule role (security-rules.md).</summary>
public static class AuthorizationPolicies
{
    public const string RequireSuperAdmin = nameof(RequireSuperAdmin);
    public const string RequireManager = nameof(RequireManager);
    public const string CanManageEmployees = nameof(CanManageEmployees);
    public const string CanManageProjects = nameof(CanManageProjects);
    public const string CanManageShifts = nameof(CanManageShifts);
    public const string CanApproveOvertime = nameof(CanApproveOvertime);
    public const string CanManagePayroll = nameof(CanManagePayroll);
    public const string CanManagePerformance = nameof(CanManagePerformance);

    public static void Register(AuthorizationOptions options)
    {
        options.AddPolicy(RequireSuperAdmin, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin)));

        options.AddPolicy(RequireManager, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanManageEmployees, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanManageProjects, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanManageShifts, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanApproveOvertime, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanManagePayroll, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));

        options.AddPolicy(CanManagePerformance, p =>
            p.RequireRole(nameof(UserRole.SuperAdmin), nameof(UserRole.Manager)));
    }
}
