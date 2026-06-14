using MediatR;
using WorkForceManager.Application.Features.PerformanceReviews.Common;

namespace WorkForceManager.Application.Features.PerformanceReviews.Queries.GetMyReviews;

/// <summary>Lấy danh sách phiếu đánh giá hiệu suất của nhân viên đang đăng nhập (mọi loại review).</summary>
public record GetMyReviewsQuery : IRequest<List<PerformanceReviewDto>>;
