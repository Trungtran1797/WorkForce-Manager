using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Đơn đăng ký làm thêm giờ (OT), duyệt một cấp bởi Manager/Admin.</summary>
public class OvertimeRequest : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>Số giờ OT (tính từ StartTime → EndTime), lưu để tổng hợp bảng công.</summary>
    public decimal Hours { get; set; }
    public string? Reason { get; set; }

    public OvertimeStatus Status { get; set; } = OvertimeStatus.Pending;

    public int? ApproverId { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectReason { get; set; }
}
