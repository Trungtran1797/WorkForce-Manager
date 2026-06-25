using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity.Authorization;

/// <summary>
/// <see cref="IAuthorizationPolicyProvider"/> tùy biến: phân giải động các policy có dạng
/// "Permission:{Module}:{Level}" (vd. "Permission:Employees:Edit") thành
/// <see cref="AuthorizationPolicy"/> chứa <see cref="PermissionRequirement"/> tương ứng.
/// Các policy khác (vd. RequireSuperAdmin, RequireManager) được ủy quyền cho
/// <see cref="DefaultAuthorizationPolicyProvider"/> (chứa các policy đăng ký qua
/// <see cref="AuthorizationPolicies.Register"/>).
/// </summary>
public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private const string PermissionPolicyPrefix = "Permission:";

    private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(PermissionPolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var parts = policyName.Split(':', StringSplitOptions.TrimEntries);

            if (parts.Length == 3
                && Enum.TryParse<PermissionModule>(parts[1], ignoreCase: true, out var module)
                && Enum.TryParse<PermissionLevel>(parts[2], ignoreCase: true, out var level))
            {
                var policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .AddRequirements(new PermissionRequirement(module, level))
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(policy);
            }
        }

        return _fallbackPolicyProvider.GetPolicyAsync(policyName);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() =>
        _fallbackPolicyProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() =>
        _fallbackPolicyProvider.GetFallbackPolicyAsync();
}
