using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.PerformanceReviews.Commands.CreateReview;
using WorkForceManager.Application.Features.PerformanceReviews.Commands.SubmitReview;
using WorkForceManager.Application.Features.PerformanceReviews.Common;
using WorkForceManager.Application.Features.PerformanceReviews.Queries.GetMyReviews;
using WorkForceManager.Application.Features.PerformanceReviews.Queries.GetTeamReviews;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/performance-reviews")]
public class PerformanceReviewsController : ApiControllerBase
{
    [HttpGet("my")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Performance) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyReviewsQuery(), ct);
        return Ok(ApiResponse<List<PerformanceReviewDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Performance) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetTeam([FromQuery] GetTeamReviewsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<PerformanceReviewDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Performance) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateReviewCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<PerformanceReviewDto>.Ok(result, "Tạo phiếu đánh giá thành công."));
    }

    [HttpPost("{id:int}/submit")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Performance) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Submit(int id, [FromBody] SubmitReviewRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new SubmitReviewCommand(id, request.Criteria, request.Comment), ct);
        return Ok(ApiResponse<PerformanceReviewDto>.Ok(result, "Nộp phiếu đánh giá thành công."));
    }
}

public record SubmitReviewRequest(IReadOnlyList<CriterionScoreInput> Criteria, string? Comment);
