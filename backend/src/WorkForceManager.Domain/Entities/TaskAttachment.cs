using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

public class TaskAttachment : BaseAuditableEntity
{
    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public int? CommentId { get; set; }
    public TaskComment? Comment { get; set; }

    /// <summary>Tên file gốc do người dùng upload.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Tên file duy nhất lưu trên đĩa/storage.</summary>
    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public int UploadedById { get; set; }
    public Employee UploadedBy { get; set; } = null!;
}
