using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Training.Commands.CompleteTraining;

public class CompleteTrainingCommandValidator : AbstractValidator<CompleteTrainingCommand>
{
    public CompleteTrainingCommandValidator()
    {
        RuleFor(x => x.EnrollmentId).GreaterThan(0);
        RuleFor(x => x.Status).Must(s => Enum.TryParse<TrainingStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");
        RuleFor(x => x.CertificateCode).MaximumLength(100);
    }
}
