using MediatR;

namespace WorkForceManager.Application.Features.Payroll.Commands.SendPayslipEmail;

public record SendPayslipEmailCommand(int Id) : IRequest<Unit>;
