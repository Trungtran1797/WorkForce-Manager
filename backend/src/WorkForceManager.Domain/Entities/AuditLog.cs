namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Audit trail cho các thay đổi quan trọng (duyệt nghỉ phép, đổi trạng thái dự án,
/// security events). Khác với audit fields trên BaseAuditableEntity.
/// </summary>
public class AuditLog
{
    public int Id { get; set; }

    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedDate { get; set; }
    public string? IpAddress { get; set; }
}
