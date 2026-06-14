namespace WorkForceManager.Application.Features.Attendances.Common;

public record AttendanceDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string Date,
    string? CheckInTime,
    string? CheckOutTime,
    string Status,
    decimal? WorkingHours,
    string? Note,
    int? ShiftId,
    string? ShiftName,
    decimal? OvertimeHours,
    bool LocationValid);
