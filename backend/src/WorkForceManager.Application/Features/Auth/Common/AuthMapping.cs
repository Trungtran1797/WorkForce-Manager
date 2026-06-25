using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Auth.Common;

public static class AuthMapping
{
    public static AuthUserDto ToAuthUserDto(this User user, Dictionary<string, string> permissions) => new(
        user.Id,
        user.Username,
        user.Email,
        user.Role.ToString(),
        user.EmployeeId,
        user.Employee?.DepartmentId,
        user.Employee?.FullName,
        permissions);
}
