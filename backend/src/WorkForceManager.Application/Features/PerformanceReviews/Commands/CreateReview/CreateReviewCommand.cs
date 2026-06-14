using MediatR;
using WorkForceManager.Application.Features.PerformanceReviews.Common;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.CreateReview;

/// <summary>Tiêu chí chấm điểm khởi tạo cho một phiếu đánh giá (Score = 0, chờ Submit).</summary>
public record CriterionInput(string Criterion, decimal Weight);

/// <summary>Tạo một phiếu đánh giá hiệu suất mới (Self/Manager/Peer) cho kỳ đánh giá.</summary>
public record CreateReviewCommand(
    int EmployeeId,
    int ReviewerId,
    string Period,
    string ReviewType,
    IReadOnlyList<CriterionInput> Criteria) : IRequest<PerformanceReviewDto>;
