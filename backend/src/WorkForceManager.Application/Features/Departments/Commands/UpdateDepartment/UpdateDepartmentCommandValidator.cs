using FluentValidation;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Departments.Commands.UpdateDepartment;

public class UpdateDepartmentCommandValidator : AbstractValidator<UpdateDepartmentCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateDepartmentCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ColorVariant).NotEmpty().MaximumLength(30);

        RuleFor(x => x)
            .Must(x => x.ParentDepartmentId != x.Id)
            .WithMessage("Một phòng ban không thể là phòng ban cha của chính nó.")
            .When(x => x.ParentDepartmentId.HasValue);

        RuleFor(x => x.ParentDepartmentId)
            .MustAsync(ParentDepartmentExistsAsync)
            .WithMessage("Phòng ban cha không tồn tại.")
            .When(x => x.ParentDepartmentId.HasValue);

        RuleFor(x => x.ParentDepartmentId)
            .MustAsync(ParentDepartmentIsTopLevelAsync)
            .WithMessage("Sơ đồ tổ chức chỉ hỗ trợ 2 cấp - phòng ban cha không được là phòng ban con của phòng ban khác.")
            .When(x => x.ParentDepartmentId.HasValue);

        RuleFor(x => x)
            .MustAsync(NotHaveChildDepartmentsAsync)
            .WithMessage("Phòng ban đang có phòng ban con nên không thể trở thành phòng ban con của phòng ban khác.")
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

    private async Task<bool> NotHaveChildDepartmentsAsync(UpdateDepartmentCommand command, CancellationToken cancellationToken)
    {
        var hasChildren = await _context.Departments
            .AnyAsync(d => d.ParentDepartmentId == command.Id, cancellationToken);

        return !hasChildren;
    }
}
