using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Quyền bổ sung theo Phòng ban đặc thù cho từng Module - nâng cao hơn mức mặc định của Role.
/// Effective permission = max(RolePermission.Level, DepartmentPermissionOverride.Level).
/// </summary>
public class DepartmentPermissionOverride : BaseAuditableEntity
{
    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public PermissionModule Module { get; set; }
    public PermissionLevel Level { get; set; }
}
