namespace WorkForceManager.Application.Features.LeaveRequests.Common;

public record LeaveRequestDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string LeaveType,
    string StartDate,
    string EndDate,
    int TotalDays,
    string? Reason,
    string Status,
    int? ManagerApproverId,
    string? ManagerApprovedDate,
    int? HrApproverId,
    string? HrApprovedDate,
    string? RejectReason);
