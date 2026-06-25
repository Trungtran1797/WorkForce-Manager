using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Permissions.Commands.UpdatePermissionMatrix;

public class UpdatePermissionMatrixCommandValidator : AbstractValidator<UpdatePermissionMatrixCommand>
{
    public UpdatePermissionMatrixCommandValidator()
    {
        RuleForEach(x => x.RolePermissions).ChildRules(rolePermission =>
        {
            rolePermission.RuleFor(x => x.Role)
                .Must(value => Enum.TryParse<UserRole>(value, out _))
                .WithMessage("Vai trò không hợp lệ.");

            rolePermission.RuleFor(x => x.Module)
                .Must(value => Enum.TryParse<PermissionModule>(value, out _))
                .WithMessage("Module không hợp lệ.");

            rolePermission.RuleFor(x => x.Level)
                .Must(value => Enum.TryParse<PermissionLevel>(value, out _))
                .WithMessage("Mức quyền không hợp lệ.");
        });

        RuleForEach(x => x.DepartmentOverrides).ChildRules(departmentOverride =>
        {
            departmentOverride.RuleFor(x => x.DepartmentId)
                .GreaterThan(0)
                .WithMessage("Phòng ban không hợp lệ.");

            departmentOverride.RuleFor(x => x.Module)
                .Must(value => Enum.TryParse<PermissionModule>(value, out _))
                .WithMessage("Module không hợp lệ.");

            departmentOverride.RuleFor(x => x.Level)
                .Must(value => Enum.TryParse<PermissionLevel>(value, out _))
                .WithMessage("Mức quyền không hợp lệ.");
        });
    }
}
