using MediatR;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Queries.GetMyLeaveRequests;

public record GetMyLeaveRequestsQuery : IRequest<List<LeaveRequestDto>>;
