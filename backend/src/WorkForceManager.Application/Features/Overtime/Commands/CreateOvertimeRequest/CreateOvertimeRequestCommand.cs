using MediatR;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Commands.CreateOvertimeRequest;

public record CreateOvertimeRequestCommand(
    string Date,
    string StartTime,
    string EndTime,
    string? Reason) : IRequest<OvertimeRequestDto>;
