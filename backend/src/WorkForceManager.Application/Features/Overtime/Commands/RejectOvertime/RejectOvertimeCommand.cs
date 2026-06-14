using MediatR;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Commands.RejectOvertime;

public record RejectOvertimeCommand(int Id, string? RejectReason) : IRequest<OvertimeRequestDto>;
