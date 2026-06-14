using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Common;
using Entities = WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTimeService _dateTime;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context, IJwtTokenService jwtTokenService, IDateTimeService dateTime)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _dateTime = dateTime;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.RefreshTokens
            .Include(r => r.User)
            .ThenInclude(u => u!.Employee)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        if (existing is null || existing.RevokedAt is not null || existing.ExpiresAt <= _dateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn.");
        }

        var user = existing.User!;
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa.");
        }

        var (accessToken, expiresAt) = _jwtTokenService.GenerateAccessToken(user);
        var (newRefreshToken, refreshExpiresAt) = _jwtTokenService.GenerateRefreshToken();

        // Rotation: revoke token cũ và liên kết tới token mới.
        existing.RevokedAt = _dateTime.UtcNow;
        existing.ReplacedByToken = newRefreshToken;

        _context.RefreshTokens.Add(new Entities.RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = _dateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, newRefreshToken, expiresAt, user.ToAuthUserDto());
    }
}
