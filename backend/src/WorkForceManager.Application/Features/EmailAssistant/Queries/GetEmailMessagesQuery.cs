using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.EmailAssistant.Queries;

public class GetEmailMessagesQuery : IRequest<List<EmailMessageDto>>
{
    public string? Query { get; set; }
    public int Limit { get; set; } = 10;
}

public class GetEmailMessagesQueryHandler : IRequestHandler<GetEmailMessagesQuery, List<EmailMessageDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMailClientService _mailClientService;

    public GetEmailMessagesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMailClientService mailClientService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mailClientService = mailClientService;
    }

    public async Task<List<EmailMessageDto>> Handle(GetEmailMessagesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return new List<EmailMessageDto>();

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (config == null) return new List<EmailMessageDto>();

        return await _mailClientService.SearchEmailsAsync(config, request.Query, request.Limit, cancellationToken);
    }
}
