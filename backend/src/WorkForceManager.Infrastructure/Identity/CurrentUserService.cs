using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public int? UserId =>
        int.TryParse(User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public string? UserName => User?.FindFirstValue(ClaimTypes.Name);

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public UserRole? Role =>
        Enum.TryParse<UserRole>(User?.FindFirstValue(ClaimTypes.Role), out var role) ? role : null;

    public int? EmployeeId =>
        int.TryParse(User?.FindFirstValue(CustomClaimTypes.EmployeeId), out var id) ? id : null;

    public int? DepartmentId =>
        int.TryParse(User?.FindFirstValue(CustomClaimTypes.DepartmentId), out var id) ? id : null;

    public string? IpAddress =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}

public static class CustomClaimTypes
{
    public const string EmployeeId = "employeeId";
    public const string DepartmentId = "departmentId";
}
