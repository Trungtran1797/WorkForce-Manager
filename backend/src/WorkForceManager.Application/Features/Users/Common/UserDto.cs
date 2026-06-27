namespace WorkForceManager.Application.Features.Users.Common;

public record UserDto(
    int Id,
    string Username,
    string Email,
    string Role,
    bool IsActive,
    int? EmployeeId,
    string? EmployeeFullName,
    string? EmployeeCode,
    string? DepartmentName
);
