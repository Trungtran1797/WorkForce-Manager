using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.SalaryConfigs.Common;

public record SalaryConfigDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    decimal BaseSalary,
    decimal Allowance,
    decimal InsuranceSalary,
    int DependentCount);

public static class SalaryConfigMapping
{
    public static SalaryConfigDto ToDto(this SalaryConfig s) => new(
        s.Id,
        s.EmployeeId,
        s.Employee?.FullName ?? string.Empty,
        s.BaseSalary,
        s.Allowance,
        s.InsuranceSalary,
        s.DependentCount);
}
