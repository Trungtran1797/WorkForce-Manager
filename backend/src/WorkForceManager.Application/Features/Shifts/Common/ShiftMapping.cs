using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Shifts.Common;

public static class ShiftMapping
{
    private const string TimeFormat = "HH:mm";
    private const string DateFormat = "yyyy-MM-dd";

    public static ShiftDto ToDto(this Shift s) => new(
        s.Id,
        s.Code,
        s.Name,
        s.StartTime.ToString(TimeFormat),
        s.EndTime.ToString(TimeFormat),
        s.BreakMinutes,
        s.ShiftType.ToString(),
        s.IsActive);

    public static ShiftAssignmentDto ToDto(this ShiftAssignment a) => new(
        a.Id,
        a.EmployeeId,
        a.Employee?.FullName ?? string.Empty,
        a.ShiftId,
        a.Shift?.Name ?? string.Empty,
        a.WorkDate.ToString(DateFormat),
        a.Note);
}
