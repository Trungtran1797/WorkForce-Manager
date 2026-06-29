using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Common.Interfaces;

public interface IMailClientService
{
    /// <summary>
    /// Tìm kiếm và lọc email dựa trên cấu hình hòm thư và từ khóa tìm kiếm.
    /// </summary>
    Task<List<EmailMessageDto>> SearchEmailsAsync(UserEmailConfig config, string? query, int maxResults = 10, CancellationToken ct = default);

    /// <summary>
    /// Lấy toàn bộ nội dung chi tiết (Body) của email theo ID.
    /// </summary>
    Task<EmailMessageDto?> GetEmailDetailsAsync(UserEmailConfig config, string messageId, CancellationToken ct = default);

    /// <summary>
    /// Gửi email bằng cấu hình SMTP (cho custom email) hoặc Gmail REST API.
    /// </summary>
    Task SendEmailAsync(UserEmailConfig config, string toEmail, string subject, string body, CancellationToken ct = default);
    
    /// <summary>
    /// Kiểm tra kết nối hòm thư với cấu hình đã cung cấp.
    /// </summary>
    Task<bool> TestConnectionAsync(UserEmailConfig config, CancellationToken ct = default);

    /// <summary>
    /// Đồng bộ email từ hòm thư về cơ sở dữ liệu cục bộ phục vụ cho AI phản hồi đầy đủ và tức thì.
    /// </summary>
    Task SyncEmailsAsync(UserEmailConfig config, int userId, IApplicationDbContext context, CancellationToken ct = default);

    /// <summary>
    /// Tải dữ liệu nhị phân của tệp đính kèm từ hòm thư.
    /// </summary>
    Task<(Stream Content, string ContentType, string FileName)> DownloadAttachmentAsync(
        UserEmailConfig config, 
        string messageId, 
        string? partSpecifier, 
        string? attachmentId, 
        CancellationToken ct = default);
}

public class EmailMessageDto
{
    public string MessageId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public string Snippet { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public List<EmailAttachmentDto> Attachments { get; set; } = new();
}

public class EmailAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string? PartSpecifier { get; set; } // IMAP body part index, e.g. "2"
    public string? AttachmentId { get; set; }  // Gmail API attachment ID
}
