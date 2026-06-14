using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Queries.GetOvertimeRequests;

public class GetOvertimeRequestsQuery : PaginationRequest, IRequest<PaginatedList<OvertimeRequestDto>>
{
    public int? DepartmentId { get; set; }
    public string? Status { get; set; }
}
