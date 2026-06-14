using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Mục tiêu OKR của phòng ban hoặc cá nhân theo kỳ (quý/năm).</summary>
public class OkrObjective : BaseAuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public OkrOwnerType OwnerType { get; set; } = OkrOwnerType.Individual;
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    /// <summary>Kỳ OKR dạng "2026-Q2" hoặc "2026".</summary>
    public string Period { get; set; } = string.Empty;
    public OkrStatus Status { get; set; } = OkrStatus.Draft;

    public ICollection<KeyResult> KeyResults { get; set; } = new List<KeyResult>();
}
