using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .Matches("[A-Z]").WithMessage("Mật khẩu phải có chữ hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu phải có chữ thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải có chữ số.");
        RuleFor(x => x.Role)
            .Must(r => Enum.TryParse<UserRole>(r, out _))
            .WithMessage("Vai trò không hợp lệ.");
    }
}
