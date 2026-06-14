using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Helpers;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Payroll.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Payroll.Commands.GeneratePayroll;

public class GeneratePayrollCommandHandler : IRequestHandler<GeneratePayrollCommand, List<PayslipDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;

    public GeneratePayrollCommandHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
    }

    public async Task<List<PayslipDto>> Handle(GeneratePayrollCommand request, CancellationToken cancellationToken)
    {
        var period = DateTime.ParseExact(request.Period + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var periodStart = period.Date;
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        var configsQuery = _context.SalaryConfigs
            .Include(s => s.Employee)
            .AsQueryable();

        if (request.DepartmentId is { } deptId)
        {
            configsQuery = configsQuery.Where(s => s.Employee!.DepartmentId == deptId);
        }

        var configs = await configsQuery.ToListAsync(cancellationToken);
        var brackets = await _context.TaxBrackets.AsNoTracking().OrderBy(t => t.Order).ToListAsync(cancellationToken);

        var existingPayslips = await _context.Payslips
            .Include(p => p.Items)
            .Where(p => p.Period == request.Period)
            .ToListAsync(cancellationToken);

        var results = new List<Payslip>();

        foreach (var config in configs)
        {
            var existing = existingPayslips.FirstOrDefault(p => p.EmployeeId == config.EmployeeId);

            // Giữ nguyên phiếu đã duyệt/đã trả (idempotent).
            if (existing is { Status: PayslipStatus.Approved or PayslipStatus.Paid })
            {
                results.Add(existing);
                continue;
            }

            var attendances = await _context.Attendances
                .Where(a => a.EmployeeId == config.EmployeeId && a.Date >= periodStart && a.Date <= periodEnd)
                .ToListAsync(cancellationToken);

            var workingDays = attendances.Count(a => a.CheckInTime != null);
            var overtimeHours = attendances.Sum(a => a.OvertimeHours ?? 0);

            var result = PayrollCalculator.Calculate(
                new PayrollInput(
                    config.BaseSalary,
                    config.Allowance,
                    config.InsuranceSalary,
                    config.DependentCount,
                    workingDays,
                    request.StandardWorkingDays,
                    overtimeHours),
                brackets);

            var payslip = existing ?? new Payslip
            {
                EmployeeId = config.EmployeeId,
                Period = request.Period
            };

            payslip.WorkingDays = workingDays;
            payslip.StandardWorkingDays = result.StandardWorkingDays;
            payslip.OvertimeHours = overtimeHours;
            payslip.BaseSalary = config.BaseSalary;
            payslip.Allowance = config.Allowance;
            payslip.OvertimePay = result.OvertimePay;
            payslip.GrossSalary = result.GrossSalary;
            payslip.Insurance = result.Insurance;
            payslip.PersonalDeduction = result.PersonalDeduction;
            payslip.DependentDeduction = result.DependentDeduction;
            payslip.TaxableIncome = result.TaxableIncome;
            payslip.PersonalIncomeTax = result.PersonalIncomeTax;
            payslip.NetSalary = result.NetSalary;
            payslip.Status = PayslipStatus.Draft;
            payslip.GeneratedDate = _dateTimeService.Now;

            payslip.Items.Clear();
            payslip.Items.Add(new PayslipItem { Label = "Lương theo công", Amount = result.SalaryByDays, IsEarning = true });
            if (config.Allowance > 0)
            {
                payslip.Items.Add(new PayslipItem { Label = "Phụ cấp", Amount = config.Allowance, IsEarning = true });
            }
            if (result.OvertimePay > 0)
            {
                payslip.Items.Add(new PayslipItem { Label = "Lương làm thêm giờ", Amount = result.OvertimePay, IsEarning = true });
            }
            payslip.Items.Add(new PayslipItem { Label = "Bảo hiểm (BHXH/BHYT/BHTN)", Amount = result.Insurance, IsEarning = false });
            payslip.Items.Add(new PayslipItem { Label = "Thuế TNCN", Amount = result.PersonalIncomeTax, IsEarning = false });

            if (existing == null)
            {
                _context.Payslips.Add(payslip);
            }

            payslip.Employee = config.Employee;
            results.Add(payslip);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return results.OrderBy(p => p.Employee?.FullName).Select(p => p.ToDto()).ToList();
    }
}
