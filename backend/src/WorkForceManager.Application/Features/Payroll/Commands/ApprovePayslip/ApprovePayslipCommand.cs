using MediatR;
using WorkForceManager.Application.Features.Payroll.Common;

namespace WorkForceManager.Application.Features.Payroll.Commands.ApprovePayslip;

public record ApprovePayslipCommand(int Id) : IRequest<PayslipDto>;
