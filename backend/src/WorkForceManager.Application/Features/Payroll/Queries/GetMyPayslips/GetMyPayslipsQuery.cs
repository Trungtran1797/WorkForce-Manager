using MediatR;
using WorkForceManager.Application.Features.Payroll.Common;

namespace WorkForceManager.Application.Features.Payroll.Queries.GetMyPayslips;

public record GetMyPayslipsQuery : IRequest<List<PayslipDto>>;
