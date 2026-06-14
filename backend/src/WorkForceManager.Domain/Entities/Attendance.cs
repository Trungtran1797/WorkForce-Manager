using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

public class Attendance : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Absent;
    public decimal? WorkingHours { get; set; }
    public string? Note { get; set; }

    /// <summary>Ca làm việc được gán cho ngày này (nếu có).</summary>
    public int? ShiftId { get; set; }
    public Shift? Shift { get; set; }

    /// <summary>Số giờ OT đã duyệt áp vào ngày công này (tổng hợp khi tính lương).</summary>
    public decimal? OvertimeHours { get; set; }

    /// <summary>Thông tin vị trí lúc check-in để ràng buộc IP/GPS.</summary>
    public string? CheckInIp { get; set; }
    public double? CheckInLatitude { get; set; }
    public double? CheckInLongitude { get; set; }

    /// <summary>True nếu check-in nằm trong dải IP/bán kính GPS hợp lệ.</summary>
    public bool LocationValid { get; set; } = true;
}
