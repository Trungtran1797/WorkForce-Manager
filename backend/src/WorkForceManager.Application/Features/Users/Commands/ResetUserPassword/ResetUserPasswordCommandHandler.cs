using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Users.Commands.ResetUserPassword;

public class ResetUserPasswordCommandHandler : IRequestHandler<ResetUserPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetUserPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Tài khoản", request.Id);

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ConflictException("Mật khẩu mới không được để trống.");
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword.Trim());

        await _context.SaveChangesAsync(cancellationToken);
    }
}
