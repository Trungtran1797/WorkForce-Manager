using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Kết quả then chốt (Key Result) thuộc một mục tiêu OKR.</summary>
public class KeyResult : BaseAuditableEntity
{
    public int ObjectiveId { get; set; }
    public OkrObjective? Objective { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public string? Unit { get; set; }
    /// <summary>Trọng số của KR trong mục tiêu (để tính tiến độ tổng có trọng số).</summary>
    public decimal Weight { get; set; } = 1m;
}
