using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

public class Project : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Investor { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public decimal Budget { get; set; }
    public string? Description { get; set; }

    /// <summary>% tiến độ 0-100.</summary>
    public int Progress { get; set; }

    /// <summary>Ngày xuất hàng (ngày giao hàng cho khách).</summary>
    public DateTime? ShippingDate { get; set; }

    /// <summary>Dự án mẫu — dùng để clone tạo dự án mới.</summary>
    public bool IsTemplate { get; set; }

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<ProjectComment> Comments { get; set; } = new List<ProjectComment>();
    public ICollection<ProjectAttachment> Attachments { get; set; } = new List<ProjectAttachment>();
}
