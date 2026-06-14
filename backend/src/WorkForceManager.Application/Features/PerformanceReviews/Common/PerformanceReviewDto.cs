using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.PerformanceReviews.Common;

public record ReviewCriterionDto(
    int Id,
    string Criterion,
    int Score,
    decimal Weight,
    string? Note);

public record PerformanceReviewDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    int ReviewerId,
    string ReviewerName,
    string Period,
    string ReviewType,
    string Status,
    decimal OverallScore,
    string OverallRating,
    string? Comment,
    string? SubmittedDate,
    IReadOnlyList<ReviewCriterionDto> Criteria);

public static class PerformanceReviewMapping
{
    private const string DateFormat = "yyyy-MM-dd";

    public static ReviewCriterionDto ToDto(this ReviewCriterion c) => new(
        c.Id,
        c.Criterion,
        c.Score,
        c.Weight,
        c.Note);

    public static PerformanceReviewDto ToDto(this PerformanceReview r) => new(
        r.Id,
        r.EmployeeId,
        r.Employee?.FullName ?? string.Empty,
        r.ReviewerId,
        r.Reviewer?.FullName ?? string.Empty,
        r.Period,
        r.ReviewType.ToString(),
        r.Status.ToString(),
        r.OverallScore,
        r.OverallRating.ToString(),
        r.Comment,
        r.SubmittedDate?.ToString(DateFormat),
        r.Criteria.OrderBy(c => c.Id).Select(c => c.ToDto()).ToList());
}
