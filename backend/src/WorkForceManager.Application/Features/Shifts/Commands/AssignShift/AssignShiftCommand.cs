using MediatR;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Commands.AssignShift;

public record AssignShiftCommand(
    int EmployeeId,
    int ShiftId,
    string WorkDate,
    string? Note) : IRequest<ShiftAssignmentDto>;
