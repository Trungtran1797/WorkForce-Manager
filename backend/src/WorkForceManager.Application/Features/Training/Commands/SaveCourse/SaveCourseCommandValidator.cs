using FluentValidation;

namespace WorkForceManager.Application.Features.Training.Commands.SaveCourse;

public class SaveCourseCommandValidator : AbstractValidator<SaveCourseCommand>
{
    public SaveCourseCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Instructor).MaximumLength(100);
        RuleFor(x => x.StartDate).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày bắt đầu không hợp lệ.");
        RuleFor(x => x.EndDate)
            .Must(d => string.IsNullOrWhiteSpace(d) || DateTime.TryParse(d, out _))
            .WithMessage("Ngày kết thúc không hợp lệ.");
    }
}
