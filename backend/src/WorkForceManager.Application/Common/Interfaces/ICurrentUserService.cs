using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>Thông tin người dùng hiện tại lấy từ JWT claims (implement ở Infrastructure).</summary>
public interface ICurrentUserService
{
    int? UserId { get; }
    string? UserName { get; }
    string? Email { get; }
    UserRole? Role { get; }
    int? EmployeeId { get; }
    int? DepartmentId { get; }
    string? IpAddress { get; }
    bool IsAuthenticated { get; }
}
