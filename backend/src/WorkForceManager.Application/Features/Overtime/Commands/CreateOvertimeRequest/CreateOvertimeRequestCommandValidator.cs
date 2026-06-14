using FluentValidation;

namespace WorkForceManager.Application.Features.Overtime.Commands.CreateOvertimeRequest;

public class CreateOvertimeRequestCommandValidator : AbstractValidator<CreateOvertimeRequestCommand>
{
    public CreateOvertimeRequestCommandValidator()
    {
        RuleFor(x => x.Date).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày làm thêm không hợp lệ.");
        RuleFor(x => x.StartTime).Must(t => TimeOnly.TryParse(t, out _)).WithMessage("Giờ bắt đầu không hợp lệ (HH:mm).");
        RuleFor(x => x.EndTime).Must(t => TimeOnly.TryParse(t, out _)).WithMessage("Giờ kết thúc không hợp lệ (HH:mm).");
        RuleFor(x => x.Reason).MaximumLength(500);
    }
}
