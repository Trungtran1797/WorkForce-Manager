using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.PerformanceReviews.Commands.CreateReview;
using WorkForceManager.Application.Features.PerformanceReviews.Commands.SubmitReview;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class PerformanceReviewCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public PerformanceReviewCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.UtcNow).Returns(new DateTime(2026, 6, 14, 9, 0, 0, DateTimeKind.Utc));

        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Nhân viên" });
        _context.Employees.Add(new Employee { Id = 2, EmployeeCode = "E2", FullName = "Quản lý" });
        _context.SaveChanges();
    }

    [Fact]
    public async Task Create_ShouldCreatePendingReview_WithCriteria()
    {
        var handler = new CreateReviewCommandHandler(_context);
        var command = new CreateReviewCommand(1, 2, "2026-Q2", nameof(ReviewType.Manager), new[]
        {
            new CriterionInput("Chất lượng công việc", 2m),
            new CriterionInput("Tinh thần hợp tác", 1m)
        });

        var result = await handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(ReviewStatus.Pending.ToString());
        result.Criteria.Should().HaveCount(2);
        result.Criteria.All(c => c.Score == 0).Should().BeTrue();
    }

    [Fact]
    public async Task Submit_ShouldComputeWeightedScore_AndRating()
    {
        var review = new PerformanceReview
        {
            EmployeeId = 1,
            ReviewerId = 2,
            Period = "2026-Q2",
            ReviewType = ReviewType.Manager,
            Status = ReviewStatus.Pending,
            OverallRating = RatingLevel.Average,
            Criteria = new List<ReviewCriterion>
            {
                new() { Criterion = "Chất lượng", Weight = 2m, Score = 0 },
                new() { Criterion = "Hợp tác", Weight = 1m, Score = 0 }
            }
        };
        _context.PerformanceReviews.Add(review);
        await _context.SaveChangesAsync();

        var c1 = review.Criteria.First(c => c.Criterion == "Chất lượng");
        var c2 = review.Criteria.First(c => c.Criterion == "Hợp tác");

        var handler = new SubmitReviewCommandHandler(_context, _dateTime.Object);
        var result = await handler.Handle(new SubmitReviewCommand(
            review.Id,
            new[]
            {
                new CriterionScoreInput(c1.Id, 5, "Tốt"),
                new CriterionScoreInput(c2.Id, 4, "Khá")
            },
            "Hoàn thành tốt"), CancellationToken.None);

        // weighted avg = (5*2 + 4*1) / 3 = 4.6667 -> *20 = 93.33
        result.OverallScore.Should().Be(93.33m);
        result.OverallRating.Should().Be(RatingLevel.Excellent.ToString());
        result.Status.Should().Be(ReviewStatus.Completed.ToString());
    }

    [Fact]
    public async Task Submit_ShouldThrowConflict_WhenAlreadyCompleted()
    {
        var review = new PerformanceReview
        {
            EmployeeId = 1,
            ReviewerId = 2,
            Period = "2026-Q2",
            ReviewType = ReviewType.Self,
            Status = ReviewStatus.Completed,
            OverallRating = RatingLevel.Good,
            Criteria = new List<ReviewCriterion>
            {
                new() { Criterion = "Chất lượng", Weight = 1m, Score = 4 }
            }
        };
        _context.PerformanceReviews.Add(review);
        await _context.SaveChangesAsync();

        var handler = new SubmitReviewCommandHandler(_context, _dateTime.Object);
        Func<Task> act = () => handler.Handle(new SubmitReviewCommand(
            review.Id,
            new[] { new CriterionScoreInput(review.Criteria.First().Id, 5, null) },
            null), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
