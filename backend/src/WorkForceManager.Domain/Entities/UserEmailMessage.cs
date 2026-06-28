using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Cấu hình lưu trữ email được đồng bộ để phục vụ Trợ lý AI trả lời đầy đủ, nhanh chóng.
/// </summary>
public class UserEmailMessage : BaseAuditableEntity
{
    public int UserId { get; set; }
    public string MessageId { get; set; } = string.Empty;
    public uint Uid { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public string Body { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
}
