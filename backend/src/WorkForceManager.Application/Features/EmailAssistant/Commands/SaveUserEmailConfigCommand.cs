using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.EmailAssistant.Commands;

public class SaveUserEmailConfigCommand : IRequest<bool>
{
    public string Provider { get; set; } = "ImapSmtp";
    public string EmailAddress { get; set; } = string.Empty;

    // IMAP (Nhận thư)
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public string? ImapPassword { get; set; }

    // SMTP (Gửi thư)
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }

    public bool UseSsl { get; set; } = true;

    // Gmail Connection
    public string? GmailRefreshToken { get; set; }
    public string? GmailAccessToken { get; set; }

    // AI Connection
    [JsonPropertyName("aiProvider")]
    public string? AiProvider { get; set; }

    [JsonPropertyName("aiModel")]
    public string? AiModel { get; set; }

    [JsonPropertyName("aiApiKey")]
    public string? AiApiKey { get; set; }
}

public class SaveUserEmailConfigCommandHandler : IRequestHandler<SaveUserEmailConfigCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEncryptionService _encryptionService;
    private readonly IMailClientService _mailClientService;

    public SaveUserEmailConfigCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IEncryptionService encryptionService,
        IMailClientService mailClientService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _encryptionService = encryptionService;
        _mailClientService = mailClientService;
    }

    public async Task<bool> Handle(SaveUserEmailConfigCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return false;

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        var isNew = false;
        if (config == null)
        {
            config = new UserEmailConfig { UserId = userId.Value };
            isNew = true;
        }

        config.Provider = request.Provider;
        config.EmailAddress = request.EmailAddress;
        config.UseSsl = request.UseSsl;

        if (request.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrEmpty(request.GmailRefreshToken)) config.GmailRefreshToken = request.GmailRefreshToken;
            if (!string.IsNullOrEmpty(request.GmailAccessToken)) config.GmailAccessToken = request.GmailAccessToken;
        }
        else
        {
            config.ImapHost = request.ImapHost;
            config.ImapPort = request.ImapPort;
            config.ImapUsername = request.ImapUsername;

            if (!string.IsNullOrEmpty(request.ImapPassword))
            {
                config.ImapPassword = _encryptionService.Encrypt(request.ImapPassword);
            }

            config.SmtpHost = request.SmtpHost;
            config.SmtpPort = request.SmtpPort;
            config.SmtpUsername = request.SmtpUsername;

            if (!string.IsNullOrEmpty(request.SmtpPassword))
            {
                config.SmtpPassword = _encryptionService.Encrypt(request.SmtpPassword);
            }
        }

        // Cấu hình AI cá nhân
        if (!string.IsNullOrEmpty(request.AiProvider))
        {
            config.AiProvider = request.AiProvider;
            config.AiModel = request.AiModel;

            if (!string.IsNullOrEmpty(request.AiApiKey))
            {
                config.AiApiKey = _encryptionService.Encrypt(request.AiApiKey);
            }
        }

        // Kiểm tra kết nối hòm thư trước khi lưu
        var isValid = await _mailClientService.TestConnectionAsync(config, cancellationToken);
        if (!isValid)
        {
            return false;
        }

        if (isNew)
        {
            _context.UserEmailConfigs.Add(config);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
