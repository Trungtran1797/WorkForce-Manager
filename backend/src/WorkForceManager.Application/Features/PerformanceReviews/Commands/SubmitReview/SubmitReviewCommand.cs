using MediatR;
using WorkForceManager.Application.Features.PerformanceReviews.Common;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.SubmitReview;

/// <summary>Điểm chấm (1-5) cho một tiêu chí cụ thể.</summary>
public record CriterionScoreInput(int CriterionId, int Score, string? Note);

/// <summary>Nộp phiếu đánh giá: chấm điểm từng tiêu chí, hệ thống tự tính điểm tổng có trọng số.</summary>
public record SubmitReviewCommand(
    int ReviewId,
    IReadOnlyList<CriterionScoreInput> Criteria,
    string? Comment) : IRequest<PerformanceReviewDto>;
