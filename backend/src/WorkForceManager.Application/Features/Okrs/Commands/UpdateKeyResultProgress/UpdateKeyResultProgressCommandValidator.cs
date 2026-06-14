using FluentValidation;

namespace WorkForceManager.Application.Features.Okrs.Commands.UpdateKeyResultProgress;

public class UpdateKeyResultProgressCommandValidator : AbstractValidator<UpdateKeyResultProgressCommand>
{
    public UpdateKeyResultProgressCommandValidator()
    {
        RuleFor(x => x.KeyResultId).GreaterThan(0);
        RuleFor(x => x.CurrentValue).GreaterThanOrEqualTo(0);
    }
}
