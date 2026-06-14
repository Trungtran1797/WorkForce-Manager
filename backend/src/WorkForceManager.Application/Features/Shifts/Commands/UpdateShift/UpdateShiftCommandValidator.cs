using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Shifts.Commands.UpdateShift;

public class UpdateShiftCommandValidator : AbstractValidator<UpdateShiftCommand>
{
    public UpdateShiftCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.StartTime).Must(BeValidTime).WithMessage("Giờ bắt đầu không hợp lệ (HH:mm).");
        RuleFor(x => x.EndTime).Must(BeValidTime).WithMessage("Giờ kết thúc không hợp lệ (HH:mm).");
        RuleFor(x => x.BreakMinutes).InclusiveBetween(0, 480);
        RuleFor(x => x.ShiftType).Must(t => Enum.TryParse<ShiftType>(t, out _)).WithMessage("Loại ca không hợp lệ.");
    }

    private static bool BeValidTime(string value) => TimeOnly.TryParse(value, out _);
}
