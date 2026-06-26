using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

public class TaskItem : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public int? AssigneeId { get; set; }
    public Employee? Assignee { get; set; }

    public int? AssignerId { get; set; }
    public Employee? Assigner { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public WorkTaskStatus Status { get; set; } = WorkTaskStatus.Todo;

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    /// <summary>% hoàn thành 0-100.</summary>
    public int Progress { get; set; }

    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? ParentTaskId { get; set; }
    public TaskItem? ParentTask { get; set; }
    public ICollection<TaskItem> SubTasks { get; set; } = new List<TaskItem>();

    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    public ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
    public ICollection<TaskAssignee> Assignees { get; set; } = new List<TaskAssignee>();
}
