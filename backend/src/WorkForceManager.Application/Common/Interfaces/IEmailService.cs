namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>Gửi email (phiếu lương, thông báo). Implement ở Infrastructure (SMTP hoặc dev/log).</summary>
public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);
}
