using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Search.Common;
using WorkForceManager.Application.Features.Search.Queries.GlobalSearch;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/search")]
public class SearchController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] GlobalSearchQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<GlobalSearchResultDto>.Ok(result));
    }
}
