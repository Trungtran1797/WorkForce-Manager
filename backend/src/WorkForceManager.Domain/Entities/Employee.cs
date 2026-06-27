using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

public class Employee : BaseAuditableEntity
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string IdCardNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Address { get; set; }

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Position { get; set; } = string.Empty;
    public DateTime HireDate { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public string? PlaceOfOrigin { get; set; }
    public string? MaritalStatus { get; set; }
    public string? OneOfficeAccount { get; set; }
}
