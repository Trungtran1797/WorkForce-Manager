namespace WorkForceManager.Application.Features.Departments.Common;

public record DepartmentDto(
    int Id,
    string Name,
    int? ManagerId,
    string ManagerName,
    int EmployeeCount,
    string Description,
    string Icon,
    string ColorVariant,
    int? ParentDepartmentId,
    string? ParentDepartmentName);
