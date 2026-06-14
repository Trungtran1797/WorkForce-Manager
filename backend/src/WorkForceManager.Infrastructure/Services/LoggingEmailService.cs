using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Services;

/// <summary>
/// Provider email mặc định cho môi trường dev: ghi nội dung email ra log có cấu trúc.
/// Production thay bằng implementation SMTP thật (cấu hình qua appsettings) mà không đổi Application layer.
/// </summary>
public class LoggingEmailService : IEmailService
{
    private readonly ILogger<LoggingEmailService> _logger;

    public LoggingEmailService(ILogger<LoggingEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Email gửi tới {ToEmail} | Tiêu đề: {Subject} | Độ dài nội dung: {Length} ký tự",
            toEmail, subject, htmlBody.Length);
        return Task.CompletedTask;
    }
}
