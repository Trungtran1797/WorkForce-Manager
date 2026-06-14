using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.LeaveRequests.Common;

public static class LeaveRequestMapping
{
    private const string DateFormat = "yyyy-MM-dd";
    private const string DateTimeFormat = "yyyy-MM-dd HH:mm:ss";

    public static LeaveRequestDto ToDto(this LeaveRequest e) => new(
        e.Id,
        e.EmployeeId,
        e.Employee?.FullName ?? string.Empty,
        e.Type.ToString(),
        e.StartDate.ToString(DateFormat),
        e.EndDate.ToString(DateFormat),
        e.TotalDays,
        e.Reason,
        e.Status.ToString(),
        e.ManagerApproverId,
        e.ManagerApprovedDate?.ToString(DateTimeFormat),
        e.HrApproverId,
        e.HrApprovedDate?.ToString(DateTimeFormat),
        e.RejectReason);
}
