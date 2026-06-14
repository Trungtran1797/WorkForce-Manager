using MediatR;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.ApproveLeaveRequest;

public record ApproveLeaveRequestCommand(int Id) : IRequest<LeaveRequestDto>;
