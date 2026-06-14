using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Queries.GetLeaveRequests;

public class GetLeaveRequestsQuery : PaginationRequest, IRequest<PaginatedList<LeaveRequestDto>>
{
    public string? Status { get; set; }
    public string? LeaveType { get; set; }
}
