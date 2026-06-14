using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Payroll.Common;

public record PayslipItemDto(string Label, decimal Amount, bool IsEarning);

public record PayslipDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string Period,
    int WorkingDays,
    int StandardWorkingDays,
    decimal OvertimeHours,
    decimal BaseSalary,
    decimal Allowance,
    decimal OvertimePay,
    decimal GrossSalary,
    decimal Insurance,
    decimal PersonalDeduction,
    decimal DependentDeduction,
    decimal TaxableIncome,
    decimal PersonalIncomeTax,
    decimal NetSalary,
    string Status,
    string GeneratedDate,
    string? ApprovedDate,
    IReadOnlyList<PayslipItemDto> Items);

public static class PayslipMapping
{
    public static PayslipDto ToDto(this Payslip p) => new(
        p.Id,
        p.EmployeeId,
        p.Employee?.FullName ?? string.Empty,
        p.Period,
        p.WorkingDays,
        p.StandardWorkingDays,
        p.OvertimeHours,
        p.BaseSalary,
        p.Allowance,
        p.OvertimePay,
        p.GrossSalary,
        p.Insurance,
        p.PersonalDeduction,
        p.DependentDeduction,
        p.TaxableIncome,
        p.PersonalIncomeTax,
        p.NetSalary,
        p.Status.ToString(),
        p.GeneratedDate.ToString("yyyy-MM-dd HH:mm"),
        p.ApprovedDate?.ToString("yyyy-MM-dd HH:mm"),
        p.Items.Select(i => new PayslipItemDto(i.Label, i.Amount, i.IsEarning)).ToList());
}
