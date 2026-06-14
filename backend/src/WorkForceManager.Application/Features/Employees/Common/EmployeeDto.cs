namespace WorkForceManager.Application.Features.Employees.Common;

public record EmployeeDto(
    int Id,
    string EmployeeCode,
    string FullName,
    string DateOfBirth,
    string Gender,
    string IdCardNumber,
    string PhoneNumber,
    string Email,
    string Address,
    int DepartmentId,
    string DepartmentName,
    string Position,
    string HireDate,
    string Status);
