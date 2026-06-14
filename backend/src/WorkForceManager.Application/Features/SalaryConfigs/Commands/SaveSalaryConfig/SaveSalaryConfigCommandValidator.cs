using FluentValidation;

namespace WorkForceManager.Application.Features.SalaryConfigs.Commands.SaveSalaryConfig;

public class SaveSalaryConfigCommandValidator : AbstractValidator<SaveSalaryConfigCommand>
{
    public SaveSalaryConfigCommandValidator()
    {
        RuleFor(x => x.EmployeeId).GreaterThan(0).WithMessage("Vui lòng chọn nhân viên.");
        RuleFor(x => x.BaseSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Allowance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.InsuranceSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DependentCount).InclusiveBetween(0, 20);
    }
}
