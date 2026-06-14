using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Overtime.Common;

public static class OvertimeMapping
{
    private const string DateFormat = "yyyy-MM-dd";
    private const string TimeFormat = "HH:mm";

    public static OvertimeRequestDto ToDto(this OvertimeRequest o) => new(
        o.Id,
        o.EmployeeId,
        o.Employee?.FullName ?? string.Empty,
        o.Date.ToString(DateFormat),
        o.StartTime.ToString(TimeFormat),
        o.EndTime.ToString(TimeFormat),
        o.Hours,
        o.Reason,
        o.Status.ToString(),
        o.ApproverId,
        o.ApprovedDate?.ToString("yyyy-MM-dd HH:mm"),
        o.RejectReason);
}
