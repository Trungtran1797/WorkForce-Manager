using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.PerformanceReviews.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.PerformanceReviews.Commands.CreateReview;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, PerformanceReviewDto>
{
    private readonly IApplicationDbContext _context;

    public CreateReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PerformanceReviewDto> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        _ = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.EmployeeId);

        _ = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.ReviewerId, cancellationToken)
            ?? throw new NotFoundException("Người đánh giá", request.ReviewerId);

        var review = new PerformanceReview
        {
            EmployeeId = request.EmployeeId,
            ReviewerId = request.ReviewerId,
            Period = request.Period.Trim(),
            ReviewType = Enum.Parse<ReviewType>(request.ReviewType),
            Status = ReviewStatus.Pending,
            OverallRating = RatingLevel.Average
        };

        foreach (var input in request.Criteria)
        {
            review.Criteria.Add(new ReviewCriterion
            {
                Criterion = input.Criterion.Trim(),
                Weight = input.Weight,
                Score = 0
            });
        }

        _context.PerformanceReviews.Add(review);
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
