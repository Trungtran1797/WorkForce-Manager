using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Đơn nghỉ phép với quy trình: Employee → Manager Approval → HR Approval → Completed.
/// </summary>
public class LeaveRequest : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public LeaveType Type { get; set; } = LeaveType.Annual;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string? Reason { get; set; }

    public LeaveStatus Status { get; set; } = LeaveStatus.PendingManager;

    public int? ManagerApproverId { get; set; }
    public DateTime? ManagerApprovedDate { get; set; }

    public int? HrApproverId { get; set; }
    public DateTime? HrApprovedDate { get; set; }

    public string? RejectReason { get; set; }
}
