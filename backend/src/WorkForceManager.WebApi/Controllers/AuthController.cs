using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Auth.Commands.Login;
using WorkForceManager.Application.Features.Auth.Commands.Logout;
using WorkForceManager.Application.Features.Auth.Commands.Register;
using WorkForceManager.Application.Features.Auth.Commands.RefreshToken;
using WorkForceManager.Application.Features.Auth.Common;
using WorkForceManager.Application.Features.Auth.Queries.GetCurrentUser;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Route("api/v1/auth")]
public class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new LoginCommand(request.UserNameOrEmail, request.Password), ct);
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Đăng nhập thành công."));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        await Mediator.Send(new LogoutCommand(request.RefreshToken), ct);
        return Ok(ApiResponse.Ok("Đã đăng xuất."));
    }

    [HttpPost("register")]
    [Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new RegisterCommand(request.Username, request.Email, request.Password, request.Role, request.EmployeeId), ct);
        return Ok(ApiResponse<AuthUserDto>.Ok(result, "Tạo tài khoản thành công."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCurrentUserQuery(), ct);
        return Ok(ApiResponse<AuthUserDto>.Ok(result));
    }
}

public record LoginRequest(string UserNameOrEmail, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record RegisterRequest(string Username, string Email, string Password, string Role, int? EmployeeId);
