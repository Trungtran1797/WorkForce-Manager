using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Common;
using Entities = WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTimeService _dateTime;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IDateTimeService dateTime)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _dateTime = dateTime;
    }

    public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var input = request.UserNameOrEmail.Trim();

        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(
                u => u.Username == input || u.Email == input, cancellationToken);

        if (user is null || !_passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            throw new UnauthorizedAccessException("Sai tài khoản hoặc mật khẩu.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa.");
        }

        var (accessToken, expiresAt) = _jwtTokenService.GenerateAccessToken(user);
        var (refreshToken, refreshExpiresAt) = _jwtTokenService.GenerateRefreshToken();

        _context.RefreshTokens.Add(new Entities.RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = _dateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, refreshToken, expiresAt, user.ToAuthUserDto());
    }
}
