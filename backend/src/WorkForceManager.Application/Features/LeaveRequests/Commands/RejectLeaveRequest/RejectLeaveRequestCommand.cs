using MediatR;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.RejectLeaveRequest;

public record RejectLeaveRequestCommand(int Id, string Reason) : IRequest<LeaveRequestDto>;
