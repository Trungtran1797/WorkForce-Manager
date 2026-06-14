using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

public class ProjectComment : BaseAuditableEntity
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int AuthorId { get; set; }
    public Employee Author { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public ICollection<ProjectAttachment> Attachments { get; set; } = new List<ProjectAttachment>();
}
