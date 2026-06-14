using FluentAssertions;
using WorkForceManager.Application.Common.Helpers;
using WorkForceManager.Domain.Entities;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class PayrollCalculatorTests
{
    private static List<TaxBracket> StandardBrackets() => new()
    {
        new() { Order = 1, FromAmount = 0, ToAmount = 5_000_000m, Rate = 0.05m },
        new() { Order = 2, FromAmount = 5_000_000m, ToAmount = 10_000_000m, Rate = 0.10m },
        new() { Order = 3, FromAmount = 10_000_000m, ToAmount = 18_000_000m, Rate = 0.15m },
        new() { Order = 4, FromAmount = 18_000_000m, ToAmount = 32_000_000m, Rate = 0.20m },
        new() { Order = 5, FromAmount = 32_000_000m, ToAmount = 52_000_000m, Rate = 0.25m },
        new() { Order = 6, FromAmount = 52_000_000m, ToAmount = 80_000_000m, Rate = 0.30m },
        new() { Order = 7, FromAmount = 80_000_000m, ToAmount = null, Rate = 0.35m },
    };

    [Fact]
    public void CalculatePit_ShouldBeZero_WhenTaxableIncomeNonPositive()
    {
        PayrollCalculator.CalculatePit(0m, StandardBrackets()).Should().Be(0m);
        PayrollCalculator.CalculatePit(-1m, StandardBrackets()).Should().Be(0m);
    }

    [Fact]
    public void CalculatePit_ShouldApplyProgressiveBrackets()
    {
        // 20.000.000: 5M*5% + 5M*10% + 8M*15% + 2M*20% = 250k+500k+1.2M+400k = 2.350.000
        var tax = PayrollCalculator.CalculatePit(20_000_000m, StandardBrackets());
        tax.Should().Be(2_350_000m);
    }

    [Fact]
    public void Calculate_ShouldComputeFullGrossInsuranceAndNet()
    {
        // BaseSalary 30tr, đủ 26/26 công, không phụ cấp/OT, 0 người phụ thuộc.
        var result = PayrollCalculator.Calculate(
            new PayrollInput(30_000_000m, 0m, 30_000_000m, 0, 26, 26, 0m),
            StandardBrackets());

        result.GrossSalary.Should().Be(30_000_000m);
        result.Insurance.Should().Be(3_150_000m); // 30tr * 10.5%
        // Taxable = 30tr - 3.15tr - 11tr (giảm trừ bản thân) = 15.85tr
        result.TaxableIncome.Should().Be(15_850_000m);
        result.NetSalary.Should().Be(result.GrossSalary - result.Insurance - result.PersonalIncomeTax);
    }

    [Fact]
    public void Calculate_ShouldProrateSalaryByWorkingDays()
    {
        var result = PayrollCalculator.Calculate(
            new PayrollInput(26_000_000m, 0m, 0m, 0, 13, 26, 0m),
            StandardBrackets());

        // 13/26 ngày → nửa lương.
        result.SalaryByDays.Should().Be(13_000_000m);
    }
}
