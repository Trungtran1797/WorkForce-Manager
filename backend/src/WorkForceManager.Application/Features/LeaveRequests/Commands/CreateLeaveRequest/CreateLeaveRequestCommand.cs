using MediatR;
using WorkForceManager.Application.Features.LeaveRequests.Common;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.CreateLeaveRequest;

public record CreateLeaveRequestCommand(
    string LeaveType,
    string StartDate,
    string EndDate,
    string Reason) : IRequest<LeaveRequestDto>;
