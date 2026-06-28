using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.EmailAssistant.Commands;

public class DisconnectUserEmailConfigCommand : IRequest<bool>
{
}

public class DisconnectUserEmailConfigCommandHandler : IRequestHandler<DisconnectUserEmailConfigCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DisconnectUserEmailConfigCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DisconnectUserEmailConfigCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return false;

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (config != null)
        {
            _context.UserEmailConfigs.Remove(config);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
