using FluentValidation;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Departments.Commands.CreateDepartment;

public class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateDepartmentCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ColorVariant).NotEmpty().MaximumLength(30);

        RuleFor(x => x.ParentDepartmentId)
            .MustAsync(ParentDepartmentExistsAsync)
            .WithMessage("Phòng ban cha không tồn tại.")
            .When(x => x.ParentDepartmentId.HasValue);

        RuleFor(x => x.ParentDepartmentId)
            .MustAsync(ParentDepartmentIsTopLevelAsync)
            .WithMessage("Sơ đồ tổ chức chỉ hỗ trợ 2 cấp - phòng ban cha không được là phòng ban con của phòng ban khác.")
            .When(x => x.ParentDepartmentId.HasValue);
    }

    private async Task<bool> ParentDepartmentExistsAsync(int? parentDepartmentId, CancellationToken cancellationToken)
    {
        if (parentDepartmentId is null)
        {
            return true;
        }

        return await _context.Departments
            .AnyAsync(d => d.Id == parentDepartmentId.Value, cancellationToken);
    }

    private async Task<bool> ParentDepartmentIsTopLevelAsync(int? parentDepartmentId, CancellationToken cancellationToken)
    {
        if (parentDepartmentId is null)
        {
            return true;
        }

        var parent = await _context.Departments
            .Where(d => d.Id == parentDepartmentId.Value)
            .Select(d => new { d.ParentDepartmentId })
            .FirstOrDefaultAsync(cancellationToken);

        return parent is not null && parent.ParentDepartmentId is null;
    }
}
