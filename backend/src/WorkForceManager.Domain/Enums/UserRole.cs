namespace WorkForceManager.Domain.Enums;

/// <summary>
/// 3 vai trò hệ thống. Lưu dạng string trong DB và đưa vào JWT claim "role".
/// </summary>
public enum UserRole
{
    SuperAdmin,
    Manager,
    Employee
}
