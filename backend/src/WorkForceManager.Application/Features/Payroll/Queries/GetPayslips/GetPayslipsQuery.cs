using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Payroll.Common;

namespace WorkForceManager.Application.Features.Payroll.Queries.GetPayslips;

public class GetPayslipsQuery : PaginationRequest, IRequest<PaginatedList<PayslipDto>>
{
    public string? Period { get; set; }
    public int? DepartmentId { get; set; }
    public string? Status { get; set; }
}
