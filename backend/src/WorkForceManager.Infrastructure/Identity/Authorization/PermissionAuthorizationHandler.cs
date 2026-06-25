using Microsoft.AspNetCore.Authorization;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity.Authorization;

/// <summary>
/// Đánh giá <see cref="PermissionRequirement"/> bằng cách đọc quyền hiệu lực (effective permission)
/// của user hiện tại từ <see cref="IPermissionService"/> (= max(role-level, department-override)).
/// Super Admin luôn được Succeed (bypass) - khớp với seed Edit cho mọi module.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;

    public PermissionAuthorizationHandler(
        ICurrentUserService currentUserService,
        IPermissionService permissionService)
    {
        _currentUserService = currentUserService;
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var role = _currentUserService.Role;

        if (role is null)
        {
            // Chưa xác thực hoặc không có claim role hợp lệ - không Succeed, để framework Fail.
            return;
        }

        if (role.Value == UserRole.SuperAdmin)
        {
            context.Succeed(requirement);
            return;
        }

        var effectiveLevel = await _permissionService.GetEffectiveLevelAsync(
            role.Value, _currentUserService.DepartmentId, requirement.Module, CancellationToken.None);

        if (effectiveLevel >= requirement.MinLevel)
        {
            context.Succeed(requirement);
        }
    }
}
