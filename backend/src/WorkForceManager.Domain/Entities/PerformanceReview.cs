using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Phiếu đánh giá hiệu suất (self / manager / peer) trong chu trình 360 độ.</summary>
public class PerformanceReview : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int ReviewerId { get; set; }
    public Employee? Reviewer { get; set; }

    public string Period { get; set; } = string.Empty;
    public ReviewType ReviewType { get; set; } = ReviewType.Manager;
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

    /// <summary>Điểm tổng hợp có trọng số (0-100) tính từ các tiêu chí khi submit.</summary>
    public decimal OverallScore { get; set; }
    public RatingLevel OverallRating { get; set; } = RatingLevel.Average;
    public string? Comment { get; set; }
    public DateTime? SubmittedDate { get; set; }

    public ICollection<ReviewCriterion> Criteria { get; set; } = new List<ReviewCriterion>();
}
