using MediatR;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Commands.ApproveOvertime;

public record ApproveOvertimeCommand(int Id) : IRequest<OvertimeRequestDto>;
