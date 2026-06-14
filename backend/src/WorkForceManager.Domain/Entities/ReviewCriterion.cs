using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Tiêu chí chấm điểm trong phiếu đánh giá hiệu suất.</summary>
public class ReviewCriterion : BaseAuditableEntity
{
    public int ReviewId { get; set; }
    public PerformanceReview? Review { get; set; }

    public string Criterion { get; set; } = string.Empty;
    /// <summary>Điểm 1-5.</summary>
    public int Score { get; set; }
    public decimal Weight { get; set; } = 1m;
    public string? Note { get; set; }
}
