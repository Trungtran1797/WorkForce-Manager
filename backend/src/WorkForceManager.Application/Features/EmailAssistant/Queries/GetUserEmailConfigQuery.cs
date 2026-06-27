using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.EmailAssistant.Dto;

namespace WorkForceManager.Application.Features.EmailAssistant.Queries;

public class GetUserEmailConfigQuery : IRequest<UserEmailConfigDto?>
{
}

public class GetUserEmailConfigQueryHandler : IRequestHandler<GetUserEmailConfigQuery, UserEmailConfigDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserEmailConfigQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UserEmailConfigDto?> Handle(GetUserEmailConfigQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return null;

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (config == null) return null;

        return new UserEmailConfigDto
        {
            Provider = config.Provider,
            EmailAddress = config.EmailAddress,
            ImapHost = config.ImapHost,
            ImapPort = config.ImapPort,
            ImapUsername = config.ImapUsername,
            HasImapPassword = !string.IsNullOrEmpty(config.ImapPassword),
            SmtpHost = config.SmtpHost,
            SmtpPort = config.SmtpPort,
            SmtpUsername = config.SmtpUsername,
            HasSmtpPassword = !string.IsNullOrEmpty(config.SmtpPassword),
            UseSsl = config.UseSsl,
            HasGmailRefreshToken = !string.IsNullOrEmpty(config.GmailRefreshToken),
            GmailAccessToken = config.GmailAccessToken,
            AiProvider = config.AiProvider,
            AiModel = config.AiModel,
            HasAiApiKey = !string.IsNullOrEmpty(config.AiApiKey)
        };
    }
}
