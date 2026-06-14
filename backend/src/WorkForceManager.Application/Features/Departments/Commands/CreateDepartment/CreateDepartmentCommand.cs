using MediatR;
using WorkForceManager.Application.Features.Departments.Common;

namespace WorkForceManager.Application.Features.Departments.Commands.CreateDepartment;

public record CreateDepartmentCommand(
    string Name,
    int? ManagerId,
    string? Description,
    string Icon,
    string ColorVariant,
    int? ParentDepartmentId) : IRequest<DepartmentDto>;
