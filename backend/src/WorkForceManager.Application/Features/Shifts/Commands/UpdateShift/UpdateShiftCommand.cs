using MediatR;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Commands.UpdateShift;

public record UpdateShiftCommand(
    int Id,
    string Code,
    string Name,
    string StartTime,
    string EndTime,
    int BreakMinutes,
    string ShiftType,
    bool IsActive) : IRequest<ShiftDto>;
