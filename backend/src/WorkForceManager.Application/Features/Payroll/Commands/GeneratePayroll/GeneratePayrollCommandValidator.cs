using System.Text.RegularExpressions;
using FluentValidation;

namespace WorkForceManager.Application.Features.Payroll.Commands.GeneratePayroll;

public partial class GeneratePayrollCommandValidator : AbstractValidator<GeneratePayrollCommand>
{
    public GeneratePayrollCommandValidator()
    {
        RuleFor(x => x.Period)
            .Must(p => PeriodRegex().IsMatch(p))
            .WithMessage("Kỳ lương phải có định dạng yyyy-MM.");
        RuleFor(x => x.StandardWorkingDays).InclusiveBetween(1, 31);
    }

    [GeneratedRegex(@"^\d{4}-(0[1-9]|1[0-2])$")]
    private static partial Regex PeriodRegex();
}
