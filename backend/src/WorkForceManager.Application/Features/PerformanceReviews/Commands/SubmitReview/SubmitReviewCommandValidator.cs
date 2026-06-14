using FluentValidation;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.SubmitReview;

public class SubmitReviewCommandValidator : AbstractValidator<SubmitReviewCommand>
{
    public SubmitReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId).GreaterThan(0);
        RuleFor(x => x.Comment).MaximumLength(2000);
        RuleFor(x => x.Criteria).NotEmpty().WithMessage("Vui lòng chấm điểm tất cả tiêu chí.");

        RuleForEach(x => x.Criteria).ChildRules(c =>
        {
            c.RuleFor(x => x.CriterionId).GreaterThan(0);
            c.RuleFor(x => x.Score).InclusiveBetween(1, 5).WithMessage("Điểm phải từ 1 đến 5.");
            c.RuleFor(x => x.Note).MaximumLength(1000);
        });
    }
}
