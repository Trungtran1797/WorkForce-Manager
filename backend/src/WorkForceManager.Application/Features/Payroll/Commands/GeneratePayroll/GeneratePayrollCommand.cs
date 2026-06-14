using MediatR;
using WorkForceManager.Application.Features.Payroll.Common;

namespace WorkForceManager.Application.Features.Payroll.Commands.GeneratePayroll;

/// <summary>
/// Tổng hợp bảng công + OT đã duyệt và tính lương cho kỳ <paramref name="Period"/> (yyyy-MM).
/// Idempotent: phiếu đã duyệt/đã trả sẽ được giữ nguyên, phiếu nháp được tính lại.
/// </summary>
public record GeneratePayrollCommand(
    string Period,
    int? DepartmentId = null,
    int StandardWorkingDays = 26) : IRequest<List<PayslipDto>>;
