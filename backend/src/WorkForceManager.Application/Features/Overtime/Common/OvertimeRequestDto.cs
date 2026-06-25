namespace WorkForceManager.Application.Features.Overtime.Common;

public record OvertimeRequestDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string Date,
    string StartTime,
    string EndTime,
    decimal Hours,
    string? Reason,
    string Status,
    int? ApproverId,
    string? ApprovedDate,
    string? RejectReason,
    int? ProjectId,
    string? ProjectName,
    int? TaskId,
    string? TaskTitle);
