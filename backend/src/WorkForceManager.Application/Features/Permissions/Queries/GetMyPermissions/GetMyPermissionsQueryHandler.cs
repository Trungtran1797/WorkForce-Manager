using MediatR;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Permissions.Queries.GetMyPermissions;

public class GetMyPermissionsQueryHandler : IRequestHandler<GetMyPermissionsQuery, Dictionary<string, string>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IPermissionService _permissionService;

    public GetMyPermissionsQueryHandler(ICurrentUserService currentUser, IPermissionService permissionService)
    {
        _currentUser = currentUser;
        _permissionService = permissionService;
    }

    public async Task<Dictionary<string, string>> Handle(GetMyPermissionsQuery request, CancellationToken cancellationToken)
    {
        var role = _currentUser.Role
            ?? throw new UnauthorizedAccessException("Chưa xác thực.");

        var permissions = await _permissionService.GetEffectivePermissionsAsync(
            role, _currentUser.DepartmentId, cancellationToken);

        return permissions.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value.ToString());
    }
}
