using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Features.Reports.Queries.ExportReport;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize(Policy = AuthorizationPolicies.RequireManager)]
[Route("api/v1/reports")]
public class ReportsController : ApiControllerBase
{
    [HttpGet("{id}/export")]
    public async Task<IActionResult> Export(string id, [FromQuery] string format, CancellationToken ct)
    {
        var result = await Mediator.Send(new ExportReportQuery(id, format), ct);
        return File(result.FileContents, result.ContentType, result.FileName);
    }
}
