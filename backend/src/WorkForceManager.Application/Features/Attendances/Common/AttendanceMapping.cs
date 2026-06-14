using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Attendances.Common;

public static class AttendanceMapping
{
    private const string DateFormat = "yyyy-MM-dd";
    private const string TimeFormat = "HH:mm:ss";

    public static AttendanceDto ToDto(this Attendance e) => new(
        e.Id,
        e.EmployeeId,
        e.Employee?.FullName ?? string.Empty,
        e.Date.ToString(DateFormat),
        e.CheckInTime?.ToString(TimeFormat),
        e.CheckOutTime?.ToString(TimeFormat),
        e.Status.ToString(),
        e.WorkingHours,
        e.Note,
        e.ShiftId,
        e.Shift?.Name,
        e.OvertimeHours,
        e.LocationValid);
}
