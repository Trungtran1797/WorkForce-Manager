using FluentValidation;

namespace WorkForceManager.Application.Features.Training.Commands.EnrollTraining;

public class EnrollTrainingCommandValidator : AbstractValidator<EnrollTrainingCommand>
{
    public EnrollTrainingCommandValidator()
    {
        RuleFor(x => x.CourseId).GreaterThan(0);
        RuleFor(x => x.EmployeeId).GreaterThan(0);
    }
}
