using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Auth.Commands.Register;
using WorkForceManager.Application.Features.Auth.Common;
using WorkForceManager.Application.Features.Users.Commands.ResetUserPassword;
using WorkForceManager.Application.Features.Users.Commands.UpdateUserRole;
using WorkForceManager.Application.Features.Users.Commands.UpdateUserStatus;
using WorkForceManager.Application.Features.Users.Common;
using WorkForceManager.Application.Features.Users.Queries.GetUsers;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/users")]
public class UsersController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Users) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] GetUsersQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<UserDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Users) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] RegisterCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<AuthUserDto>.Ok(result, "Tạo tài khoản thành công."));
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Users) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken ct)
    {
        await Mediator.Send(new UpdateUserStatusCommand(id, request.IsActive), ct);
        return Ok(ApiResponse.Ok("Cập nhật trạng thái tài khoản thành công."));
    }

    [HttpPut("{id:int}/role")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Users) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        await Mediator.Send(new UpdateUserRoleCommand(id, request.Role), ct);
        return Ok(ApiResponse.Ok("Cập nhật vai trò tài khoản thành công."));
    }

    [HttpPut("{id:int}/reset-password")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Users) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetUserPasswordRequest request, CancellationToken ct)
    {
        await Mediator.Send(new ResetUserPasswordCommand(id, request.NewPassword), ct);
        return Ok(ApiResponse.Ok("Đặt lại mật khẩu tài khoản thành công."));
    }
}

public record UpdateUserStatusRequest(bool IsActive);
public record UpdateUserRoleRequest(string Role);
public record ResetUserPasswordRequest(string NewPassword);
