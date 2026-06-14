using FluentValidation;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.AddProjectComment;

public class AddProjectCommentCommandValidator : AbstractValidator<AddProjectCommentCommand>
{
    public AddProjectCommentCommandValidator()
    {
        RuleFor(x => x.ProjectId).GreaterThan(0);

        RuleFor(x => x.Content).MaximumLength(2000);

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Content) || (x.Files != null && x.Files.Count > 0))
            .WithMessage("Bình luận phải có nội dung hoặc ít nhất một file đính kèm.");
    }
}
