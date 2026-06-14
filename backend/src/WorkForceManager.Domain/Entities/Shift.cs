using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Cấu hình ca làm việc (hành chính, ca kíp, ca đêm).</summary>
public class Shift : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>Thời gian nghỉ giữa ca (phút), trừ ra khi tính giờ công.</summary>
    public int BreakMinutes { get; set; }

    public ShiftType ShiftType { get; set; } = ShiftType.Administrative;
    public bool IsActive { get; set; } = true;

    public ICollection<ShiftAssignment> Assignments { get; set; } = new List<ShiftAssignment>();
}
