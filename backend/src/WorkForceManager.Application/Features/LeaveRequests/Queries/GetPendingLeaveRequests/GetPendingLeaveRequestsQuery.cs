using MediatR;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Queries.GetPendingLeaveRequests;

public record GetPendingLeaveRequestsQuery : IRequest<List<LeaveRequestDto>>;
