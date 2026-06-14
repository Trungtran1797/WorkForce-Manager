using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Common.Helpers;

/// <summary>
/// Tính toán lương tháng: lương theo công + OT, bảo hiểm, giảm trừ và thuế TNCN lũy tiến.
/// Hằng số theo quy định VN hiện hành; tách riêng để dễ cập nhật khi luật thay đổi.
/// </summary>
public static class PayrollCalculator
{
    /// <summary>Giảm trừ bản thân: 11.000.000 đ/tháng.</summary>
    public const decimal PersonalDeduction = 11_000_000m;

    /// <summary>Giảm trừ mỗi người phụ thuộc: 4.400.000 đ/tháng.</summary>
    public const decimal DependentDeduction = 4_400_000m;

    /// <summary>Tỉ lệ bảo hiểm bắt buộc phần người lao động: BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5%.</summary>
    public const decimal EmployeeInsuranceRate = 0.105m;

    /// <summary>Hệ số lương làm thêm giờ (ngày thường) = 150%.</summary>
    public const decimal OvertimeMultiplier = 1.5m;

    public const int DefaultStandardWorkingDays = 26;
    private const int WorkingHoursPerDay = 8;

    /// <summary>Tính thuế TNCN lũy tiến từng phần trên thu nhập tính thuế.</summary>
    public static decimal CalculatePit(decimal taxableIncome, IReadOnlyList<TaxBracket> brackets)
    {
        if (taxableIncome <= 0 || brackets.Count == 0)
        {
            return 0m;
        }

        decimal tax = 0m;
        foreach (var bracket in brackets.OrderBy(b => b.Order))
        {
            if (taxableIncome <= bracket.FromAmount)
            {
                break;
            }

            var upper = bracket.ToAmount ?? taxableIncome;
            var portion = Math.Min(taxableIncome, upper) - bracket.FromAmount;
            if (portion > 0)
            {
                tax += portion * bracket.Rate;
            }
        }

        return Math.Round(tax, 0);
    }

    public static PayrollResult Calculate(PayrollInput input, IReadOnlyList<TaxBracket> brackets)
    {
        var standardDays = input.StandardWorkingDays <= 0 ? DefaultStandardWorkingDays : input.StandardWorkingDays;

        var salaryByDays = Math.Round(input.BaseSalary * input.WorkingDays / standardDays, 0);
        var hourlyRate = input.BaseSalary / (standardDays * WorkingHoursPerDay);
        var overtimePay = Math.Round(hourlyRate * OvertimeMultiplier * input.OvertimeHours, 0);

        var gross = salaryByDays + input.Allowance + overtimePay;
        var insurance = Math.Round(input.InsuranceSalary * EmployeeInsuranceRate, 0);
        var dependentDeduction = DependentDeduction * input.DependentCount;

        var taxable = gross - insurance - PersonalDeduction - dependentDeduction;
        if (taxable < 0)
        {
            taxable = 0m;
        }

        var pit = CalculatePit(taxable, brackets);
        var net = gross - insurance - pit;

        return new PayrollResult(
            StandardWorkingDays: standardDays,
            SalaryByDays: salaryByDays,
            OvertimePay: overtimePay,
            GrossSalary: gross,
            Insurance: insurance,
            PersonalDeduction: PersonalDeduction,
            DependentDeduction: dependentDeduction,
            TaxableIncome: taxable,
            PersonalIncomeTax: pit,
            NetSalary: net);
    }
}

public record PayrollInput(
    decimal BaseSalary,
    decimal Allowance,
    decimal InsuranceSalary,
    int DependentCount,
    int WorkingDays,
    int StandardWorkingDays,
    decimal OvertimeHours);

public record PayrollResult(
    int StandardWorkingDays,
    decimal SalaryByDays,
    decimal OvertimePay,
    decimal GrossSalary,
    decimal Insurance,
    decimal PersonalDeduction,
    decimal DependentDeduction,
    decimal TaxableIncome,
    decimal PersonalIncomeTax,
    decimal NetSalary);
