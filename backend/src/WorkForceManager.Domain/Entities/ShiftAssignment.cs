using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Gán ca làm việc cho một nhân viên theo ngày cụ thể.</summary>
public class ShiftAssignment : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public DateTime WorkDate { get; set; }
    public string? Note { get; set; }
}
