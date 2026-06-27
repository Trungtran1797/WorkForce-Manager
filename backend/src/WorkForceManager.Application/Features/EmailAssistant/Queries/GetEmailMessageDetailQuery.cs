using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.EmailAssistant.Queries;

public class GetEmailMessageDetailQuery : IRequest<EmailMessageDto?>
{
    public string MessageId { get; set; } = string.Empty;
}

public class GetEmailMessageDetailQueryHandler : IRequestHandler<GetEmailMessageDetailQuery, EmailMessageDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMailClientService _mailClientService;

    public GetEmailMessageDetailQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMailClientService mailClientService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mailClientService = mailClientService;
    }

    public async Task<EmailMessageDto?> Handle(GetEmailMessageDetailQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return null;

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (config == null) return null;

        return await _mailClientService.GetEmailDetailsAsync(config, request.MessageId, cancellationToken);
    }
}
