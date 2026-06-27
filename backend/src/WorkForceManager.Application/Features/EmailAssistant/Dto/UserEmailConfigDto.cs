namespace WorkForceManager.Application.Features.EmailAssistant.Dto;

public class UserEmailConfigDto
{
    public string Provider { get; set; } = "ImapSmtp";
    public string EmailAddress { get; set; } = string.Empty;

    // IMAP (Nhận thư)
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public bool HasImapPassword { get; set; }

    // SMTP (Gửi thư)
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }
    public bool HasSmtpPassword { get; set; }

    public bool UseSsl { get; set; } = true;

    // Gmail Connection
    public bool HasGmailRefreshToken { get; set; }
    public string? GmailAccessToken { get; set; }

    // AI Connection
    public string? AiProvider { get; set; }
    public string? AiModel { get; set; }
    public bool HasAiApiKey { get; set; }
}
