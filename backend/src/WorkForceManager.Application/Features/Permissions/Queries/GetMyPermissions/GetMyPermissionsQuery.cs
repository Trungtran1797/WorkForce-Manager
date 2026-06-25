using MediatR;

namespace WorkForceManager.Application.Features.Permissions.Queries.GetMyPermissions;

/// <summary>Lấy quyền hiệu lực (None/View/Edit) trên từng module cho user hiện tại.</summary>
public record GetMyPermissionsQuery : IRequest<Dictionary<string, string>>;
