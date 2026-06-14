using MediatR;
using WorkForceManager.Application.Features.SalaryConfigs.Common;

namespace WorkForceManager.Application.Features.SalaryConfigs.Commands.SaveSalaryConfig;

/// <summary>Tạo/cập nhật cấu hình lương cho nhân viên (mỗi nhân viên 1 cấu hình).</summary>
public record SaveSalaryConfigCommand(
    int EmployeeId,
    decimal BaseSalary,
    decimal Allowance,
    decimal InsuranceSalary,
    int DependentCount) : IRequest<SalaryConfigDto>;
