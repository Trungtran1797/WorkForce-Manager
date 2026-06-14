using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Okrs.Commands.SaveObjective;

public class SaveObjectiveCommandValidator : AbstractValidator<SaveObjectiveCommand>
{
    public SaveObjectiveCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Period).NotEmpty().MaximumLength(10);
        RuleFor(x => x.OwnerType).Must(t => Enum.TryParse<OkrOwnerType>(t, out _)).WithMessage("Loại mục tiêu không hợp lệ.");
        RuleFor(x => x.Status).Must(s => Enum.TryParse<OkrStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");

        RuleFor(x => x.DepartmentId)
            .NotNull()
            .When(x => x.OwnerType == nameof(OkrOwnerType.Department))
            .WithMessage("Vui lòng chọn phòng ban.");

        RuleFor(x => x.EmployeeId)
            .NotNull()
            .When(x => x.OwnerType == nameof(OkrOwnerType.Individual))
            .WithMessage("Vui lòng chọn nhân viên.");

        RuleForEach(x => x.KeyResults).ChildRules(kr =>
        {
            kr.RuleFor(k => k.Title).NotEmpty().MaximumLength(200);
            kr.RuleFor(k => k.TargetValue).GreaterThan(0).WithMessage("Mục tiêu phải lớn hơn 0.");
            kr.RuleFor(k => k.CurrentValue).GreaterThanOrEqualTo(0);
            kr.RuleFor(k => k.Weight).GreaterThan(0);
            kr.RuleFor(k => k.Unit).MaximumLength(50);
        });
    }
}
