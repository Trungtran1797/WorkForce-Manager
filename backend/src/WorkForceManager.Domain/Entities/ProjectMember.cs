using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Bảng join nhân sự ↔ dự án, có thêm vai trò trong dự án và ngày tham gia.</summary>
public class ProjectMember : BaseAuditableEntity
{
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string RoleInProject { get; set; } = string.Empty;
    public DateTime JoinedDate { get; set; }
}
