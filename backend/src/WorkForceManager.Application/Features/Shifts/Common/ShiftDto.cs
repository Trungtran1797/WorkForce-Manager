namespace WorkForceManager.Application.Features.Shifts.Common;

public record ShiftDto(
    int Id,
    string Code,
    string Name,
    string StartTime,
    string EndTime,
    int BreakMinutes,
    string ShiftType,
    bool IsActive);

public record ShiftAssignmentDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    int ShiftId,
    string ShiftName,
    string WorkDate,
    string? Note);
