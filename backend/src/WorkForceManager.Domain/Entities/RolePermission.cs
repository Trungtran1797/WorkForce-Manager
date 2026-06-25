using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Mức quyền mặc định theo Vai trò (Role) cho từng Module nghiệp vụ.
/// Effective permission = max(RolePermission.Level, DepartmentPermissionOverride.Level).
/// </summary>
public class RolePermission : BaseAuditableEntity
{
    public UserRole Role { get; set; }
    public PermissionModule Module { get; set; }
    public PermissionLevel Level { get; set; }
}
