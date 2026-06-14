using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.PerformanceReviews.Common;

namespace WorkForceManager.Application.Features.PerformanceReviews.Queries.GetTeamReviews;

public class GetTeamReviewsQuery : PaginationRequest, IRequest<PaginatedList<PerformanceReviewDto>>
{
    public string? Period { get; set; }
    public int? DepartmentId { get; set; }
    public int? EmployeeId { get; set; }
    public string? Status { get; set; }
}
