namespace WorkForceManager.Application.Features.Auth.Common;

public record AuthUserDto(
    int Id,
    string Username,
    string Email,
    string Role,
    int? EmployeeId,
    int? DepartmentId,
    string? FullName,
    Dictionary<string, string> Permissions);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    AuthUserDto User);
