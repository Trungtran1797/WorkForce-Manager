using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Auth.Commands.ChangePassword;

public record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword
) : IRequest;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            throw new NotFoundException("Tài khoản không tồn tại.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
            ?? throw new NotFoundException("Người dùng", userId.Value);

        // Xác thực mật khẩu cũ
        if (!_passwordHasher.Verify(user.PasswordHash, request.CurrentPassword))
        {
            var failures = new List<ValidationFailure>
            {
                new("CurrentPassword", "Mật khẩu hiện tại không chính xác.")
            };
            throw new ValidationException(failures);
        }

        // Validate mật khẩu mới tối thiểu 6 ký tự
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            var failures = new List<ValidationFailure>
            {
                new("NewPassword", "Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.")
            };
            throw new ValidationException(failures);
        }

        // Mã hóa mật khẩu mới và lưu
        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
