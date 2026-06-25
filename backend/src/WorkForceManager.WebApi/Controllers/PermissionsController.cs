using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Permissions.Commands.UpdatePermissionMatrix;
using WorkForceManager.Application.Features.Permissions.Common;
using WorkForceManager.Application.Features.Permissions.Queries.GetMyPermissions;
using WorkForceManager.Application.Features.Permissions.Queries.GetPermissionMatrix;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/permissions")]
public class PermissionsController : ApiControllerBase
{
    [HttpGet("matrix")]
    [Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
    public async Task<IActionResult> GetMatrix(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPermissionMatrixQuery(), ct);
        return Ok(ApiResponse<PermissionMatrixDto>.Ok(result));
    }

    [HttpPut("matrix")]
    [Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
    public async Task<IActionResult> UpdateMatrix([FromBody] UpdatePermissionMatrixCommand command, CancellationToken ct)
    {
        await Mediator.Send(command, ct);
        return Ok(ApiResponse.Ok("Cập nhật ma trận phân quyền thành công."));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyPermissions(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyPermissionsQuery(), ct);
        return Ok(ApiResponse<Dictionary<string, string>>.Ok(result));
    }
}
