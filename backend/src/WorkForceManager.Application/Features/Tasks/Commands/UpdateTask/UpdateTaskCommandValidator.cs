using FluentValidation;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Commands.UpdateTask;

public class UpdateTaskCommandValidator : AbstractValidator<UpdateTaskCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateTaskCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Progress).InclusiveBetween(0, 100);
        RuleFor(x => x.Priority).Must(p => Enum.TryParse<TaskPriority>(p, out _)).WithMessage("Độ ưu tiên không hợp lệ.");
        RuleFor(x => x.Status).Must(s => Enum.TryParse<WorkTaskStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");

        RuleFor(x => x)
            .Must(x => x.ParentTaskId != x.Id)
            .WithMessage("Một công việc không thể là công việc cha của chính nó.")
            .When(x => x.ParentTaskId.HasValue);

        RuleFor(x => x.ParentTaskId)
            .MustAsync(ParentTaskExistsAsync)
            .WithMessage("Công việc cha không tồn tại.")
            .When(x => x.ParentTaskId.HasValue);

        RuleFor(x => x.ParentTaskId)
            .MustAsync(ParentTaskHasNoParentAsync)
            .WithMessage("Chỉ hỗ trợ tối đa 1 cấp công việc con - không thể chọn một công việc con làm công việc cha.")
            .When(x => x.ParentTaskId.HasValue);

        RuleFor(x => x)
            .MustAsync(ParentTaskProjectMatchesAsync)
            .WithMessage("Công việc con phải thuộc cùng dự án với công việc cha.")
            .When(x => x.ParentTaskId.HasValue && x.ProjectId.HasValue);
    }

    private async Task<bool> ParentTaskExistsAsync(int? parentTaskId, CancellationToken cancellationToken)
    {
        if (parentTaskId is null)
        {
            return true;
        }

        return await _context.Tasks.AnyAsync(t => t.Id == parentTaskId.Value, cancellationToken);
    }

    private async Task<bool> ParentTaskHasNoParentAsync(int? parentTaskId, CancellationToken cancellationToken)
    {
        if (parentTaskId is null)
        {
            return true;
        }

        var parent = await _context.Tasks
            .Where(t => t.Id == parentTaskId.Value)
            .Select(t => new { t.ParentTaskId })
            .FirstOrDefaultAsync(cancellationToken);

        return parent is not null && parent.ParentTaskId is null;
    }

    private async Task<bool> ParentTaskProjectMatchesAsync(UpdateTaskCommand command, CancellationToken cancellationToken)
    {
        if (command.ParentTaskId is null || command.ProjectId is null)
        {
            return true;
        }

        var parentProjectId = await _context.Tasks
            .Where(t => t.Id == command.ParentTaskId.Value)
            .Select(t => t.ProjectId)
            .FirstOrDefaultAsync(cancellationToken);

        return parentProjectId is null || parentProjectId == command.ProjectId;
    }
}
