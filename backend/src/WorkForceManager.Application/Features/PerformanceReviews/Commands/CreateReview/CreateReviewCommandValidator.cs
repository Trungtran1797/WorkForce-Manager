using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.CreateReview;

public class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.EmployeeId).GreaterThan(0).WithMessage("Vui lòng chọn nhân viên được đánh giá.");
        RuleFor(x => x.ReviewerId).GreaterThan(0).WithMessage("Vui lòng chọn người đánh giá.");
        RuleFor(x => x.Period).NotEmpty().MaximumLength(10);
        RuleFor(x => x.ReviewType).Must(t => Enum.TryParse<ReviewType>(t, out _)).WithMessage("Loại đánh giá không hợp lệ.");
        RuleFor(x => x.Criteria).NotEmpty().WithMessage("Phiếu đánh giá phải có ít nhất 1 tiêu chí.");

        RuleForEach(x => x.Criteria).ChildRules(c =>
        {
            c.RuleFor(x => x.Criterion).NotEmpty().MaximumLength(200);
            c.RuleFor(x => x.Weight).GreaterThan(0);
        });
    }
}
