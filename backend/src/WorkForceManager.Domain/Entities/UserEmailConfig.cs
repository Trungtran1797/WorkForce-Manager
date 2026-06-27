using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Cấu hình kết nối hòm thư của người dùng phục vụ cho Trợ lý Email AI.
/// Hỗ trợ Gmail (OAuth2) và hòm thư doanh nghiệp (IMAP/SMTP).
/// </summary>
public class UserEmailConfig : BaseAuditableEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// Nhà cung cấp: "Gmail" hoặc "ImapSmtp"
    /// </summary>
    public string Provider { get; set; } = "ImapSmtp";

    public string EmailAddress { get; set; } = string.Empty;

    // Cấu hình IMAP (Nhận thư - mail.saigonspices.com.vn)
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public string? ImapPassword { get; set; } // Được mã hoá đối xứng AES

    // Cấu hình SMTP (Gửi thư)
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; } // Được mã hoá đối xứng AES

    public bool UseSsl { get; set; } = true;

    // Cấu hình Gmail OAuth2
    public string? GmailRefreshToken { get; set; }
    public string? GmailAccessToken { get; set; }

    // Cấu hình AI cá nhân
    public string? AiProvider { get; set; } // "Gemini" hoặc "OpenAI"
    public string? AiModel { get; set; }    // Phiên bản mô hình (vd: gpt-4o, gemini-1.5-flash)
    public string? AiApiKey { get; set; }   // Lưu mã hoá đối xứng AES
}
