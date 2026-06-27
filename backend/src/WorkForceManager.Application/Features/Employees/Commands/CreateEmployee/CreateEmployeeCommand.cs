using MediatR;
using WorkForceManager.Application.Features.Employees.Common;

namespace WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;

public record CreateEmployeeCommand(
    string EmployeeCode,
    string FullName,
    string DateOfBirth,
    string Gender,
    string IdCardNumber,
    string PhoneNumber,
    string Email,
    string? Address,
    int DepartmentId,
    string Position,
    string HireDate,
    string Status,
    string? PlaceOfOrigin,
    string? MaritalStatus,
    string? OneOfficeAccount) : IRequest<EmployeeDto>;
