using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Contracts.Common;

public record ContractDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string ContractCode,
    string ContractType,
    string StartDate,
    string? EndDate,
    decimal BaseSalary,
    decimal Allowance,
    decimal InsuranceSalary,
    string Status,
    string? FileUrl,
    int? ParentContractId);

public static class ContractMapping
{
    private const string DateFormat = "yyyy-MM-dd";

    public static ContractDto ToDto(this EmploymentContract c) => new(
        c.Id,
        c.EmployeeId,
        c.Employee?.FullName ?? string.Empty,
        c.ContractCode,
        c.ContractType.ToString(),
        c.StartDate.ToString(DateFormat),
        c.EndDate?.ToString(DateFormat),
        c.BaseSalary,
        c.Allowance,
        c.InsuranceSalary,
        c.Status.ToString(),
        c.FileUrl,
        c.ParentContractId);
}
