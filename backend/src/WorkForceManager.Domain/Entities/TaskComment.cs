using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

public class TaskComment : BaseAuditableEntity
{
    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public int AuthorId { get; set; }
    public Employee Author { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
}
