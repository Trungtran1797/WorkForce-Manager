using FluentValidation;

namespace WorkForceManager.Application.Features.Shifts.Commands.AssignShift;

public class AssignShiftCommandValidator : AbstractValidator<AssignShiftCommand>
{
    public AssignShiftCommandValidator()
    {
        RuleFor(x => x.EmployeeId).GreaterThan(0).WithMessage("Vui lòng chọn nhân viên.");
        RuleFor(x => x.ShiftId).GreaterThan(0).WithMessage("Vui lòng chọn ca làm việc.");
        RuleFor(x => x.WorkDate).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày làm việc không hợp lệ.");
    }
}
