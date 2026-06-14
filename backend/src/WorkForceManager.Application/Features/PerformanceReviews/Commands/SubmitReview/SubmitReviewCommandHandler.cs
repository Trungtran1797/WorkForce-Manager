using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.PerformanceReviews.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.SubmitReview;

public class SubmitReviewCommandHandler : IRequestHandler<SubmitReviewCommand, PerformanceReviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;

    public SubmitReviewCommandHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
    }

    public async Task<PerformanceReviewDto> Handle(SubmitReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.PerformanceReviews
            .Include(r => r.Criteria)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken)
            ?? throw new NotFoundException("Phiếu đánh giá", request.ReviewId);

        if (review.Status == ReviewStatus.Completed)
        {
            throw new ConflictException("Phiếu đánh giá đã hoàn tất, không thể nộp lại.");
        }

        var scoreById = request.Criteria.ToDictionary(c => c.CriterionId, c => c);
        foreach (var criterion in review.Criteria)
        {
            if (!scoreById.TryGetValue(criterion.Id, out var input))
            {
                throw new ValidationException(new[]
                {
                    new FluentValidation.Results.ValidationFailure(nameof(request.Criteria), $"Thiếu điểm cho tiêu chí '{criterion.Criterion}'.")
                });
            }

            criterion.Score = input.Score;
            criterion.Note = input.Note;
        }

        var totalWeight = review.Criteria.Sum(c => c.Weight);
        var weightedScore = totalWeight > 0
            ? review.Criteria.Sum(c => c.Score * c.Weight) / totalWeight
            : 0m;

        review.OverallScore = Math.Round(weightedScore * 20m, 2);
        review.OverallRating = review.OverallScore switch
        {
            >= 90 => RatingLevel.Excellent,
            >= 70 => RatingLevel.Good,
            >= 50 => RatingLevel.Average,
            _ => RatingLevel.Poor
        };
        review.Comment = request.Comment;
        review.Status = ReviewStatus.Completed;
        review.SubmittedDate = _dateTimeService.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Criteria)
            .FirstAsync(r => r.Id == review.Id, cancellationToken);

        return saved.ToDto();
    }
}
