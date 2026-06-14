using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Payroll.Commands.GeneratePayroll;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class GeneratePayrollCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public GeneratePayrollCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.Now).Returns(new DateTime(2026, 6, 30, 9, 0, 0));
    }

    private async Task SeedAsync()
    {
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        _context.SalaryConfigs.Add(new SalaryConfig
        {
            EmployeeId = 1, BaseSalary = 26_000_000m, Allowance = 0m, InsuranceSalary = 26_000_000m, DependentCount = 0,
        });
        _context.TaxBrackets.AddRange(
            new TaxBracket { Order = 1, FromAmount = 0, ToAmount = 5_000_000m, Rate = 0.05m },
            new TaxBracket { Order = 2, FromAmount = 5_000_000m, ToAmount = 10_000_000m, Rate = 0.10m },
            new TaxBracket { Order = 3, FromAmount = 10_000_000m, ToAmount = 18_000_000m, Rate = 0.15m });
        // 26 ngày công trong tháng 6/2026.
        for (var day = 1; day <= 26; day++)
        {
            _context.Attendances.Add(new Attendance
            {
                EmployeeId = 1,
                Date = new DateTime(2026, 6, day),
                CheckInTime = new DateTime(2026, 6, day, 8, 0, 0),
                Status = AttendanceStatus.Full,
            });
        }
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task Generate_ShouldCreateDraftPayslip()
    {
        await SeedAsync();
        var handler = new GeneratePayrollCommandHandler(_context, _dateTime.Object);

        var result = await handler.Handle(new GeneratePayrollCommand("2026-06", null, 26), CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].WorkingDays.Should().Be(26);
        result[0].GrossSalary.Should().Be(26_000_000m);
        result[0].Status.Should().Be(PayslipStatus.Draft.ToString());
        result[0].Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Generate_ShouldNotOverwriteApprovedPayslip()
    {
        await SeedAsync();
        _context.Payslips.Add(new Payslip
        {
            EmployeeId = 1,
            Period = "2026-06",
            Status = PayslipStatus.Approved,
            NetSalary = 999m,
            GeneratedDate = new DateTime(2026, 6, 28),
        });
        await _context.SaveChangesAsync();

        var handler = new GeneratePayrollCommandHandler(_context, _dateTime.Object);
        var result = await handler.Handle(new GeneratePayrollCommand("2026-06", null, 26), CancellationToken.None);

        // Phiếu đã duyệt giữ nguyên (NetSalary 999, không tính lại).
        result.Should().ContainSingle();
        result[0].Status.Should().Be(PayslipStatus.Approved.ToString());
        result[0].NetSalary.Should().Be(999m);
        (await _context.Payslips.CountAsync()).Should().Be(1);
    }
}
