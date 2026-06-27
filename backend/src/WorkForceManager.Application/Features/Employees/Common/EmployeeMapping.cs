using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Employees.Common;

public static class EmployeeMapping
{
    private const string DateFormat = "yyyy-MM-dd";

    public static EmployeeDto ToDto(this Employee e) => new(
        e.Id,
        e.EmployeeCode,
        e.FullName,
        e.DateOfBirth.ToString(DateFormat),
        e.Gender.ToString(),
        e.IdCardNumber,
        e.PhoneNumber,
        e.Email,
        e.Address ?? string.Empty,
        e.DepartmentId,
        e.Department?.Name ?? string.Empty,
        e.Position,
        e.HireDate.ToString(DateFormat),
        e.Status.ToString(),
        e.PlaceOfOrigin,
        e.MaritalStatus,
        e.OneOfficeAccount,
        e.AvatarUrl,
        e.CoverPhotoUrl);
}
