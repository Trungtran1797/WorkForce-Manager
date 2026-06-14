using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Dashboard.Common;
using WorkForceManager.Application.Features.Dashboard.Queries.GetDashboardStats;
using WorkForceManager.Application.Features.Dashboard.Queries.GetWeeklyProgress;
using WorkForceManager.Application.Features.Dashboard.Queries.GetRecentActivities;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/dashboard")]
public class DashboardController : ApiControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDashboardStatsQuery(), ct);
        return Ok(ApiResponse<DashboardStatsDto>.Ok(result));
    }

    [HttpGet("weekly-progress")]
    public async Task<IActionResult> GetWeeklyProgress(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetWeeklyProgressQuery(), ct);
        return Ok(ApiResponse<List<WeeklyProgressDto>>.Ok(result));
    }

    [HttpGet("recent-activities")]
    public async Task<IActionResult> GetRecentActivities(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRecentActivitiesQuery(), ct);
        return Ok(ApiResponse<List<RecentActivityDto>>.Ok(result));
    }
}
