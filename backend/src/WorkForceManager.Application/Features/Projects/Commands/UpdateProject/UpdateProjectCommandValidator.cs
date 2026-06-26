using FluentValidation;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Commands.UpdateProject;

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateProjectCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Code)
            .MaximumLength(30)
            .MustAsync(CodeIsUniqueAsync)
            .WithMessage("Số hợp đồng đã tồn tại.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Investor).MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Budget).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Progress).InclusiveBetween(0, 100);
        RuleFor(x => x.Status).Must(s => Enum.TryParse<ProjectStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");
        RuleFor(x => x.StartDate).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày bắt đầu không hợp lệ.");
        RuleFor(x => x.EndDate).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày kết thúc không hợp lệ.");
        RuleFor(x => x)
            .Must(x => !DateTime.TryParse(x.StartDate, out var s) || !DateTime.TryParse(x.EndDate, out var e) || e >= s)
            .WithMessage("Ngày kết thúc phải sau ngày bắt đầu.")
            .WithName("EndDate");
    }

    private async Task<bool> CodeIsUniqueAsync(UpdateProjectCommand command, string code, CancellationToken cancellationToken)
    {
        var trimmed = code.Trim();
        return !await _context.Projects
            .AnyAsync(p => p.Code == trimmed && p.Id != command.Id, cancellationToken);
    }
}
