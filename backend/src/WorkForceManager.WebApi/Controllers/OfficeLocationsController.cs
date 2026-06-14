using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.OfficeLocations.Commands.DeleteOfficeLocation;
using WorkForceManager.Application.Features.OfficeLocations.Commands.SaveOfficeLocation;
using WorkForceManager.Application.Features.OfficeLocations.Common;
using WorkForceManager.Application.Features.OfficeLocations.Queries.GetOfficeLocations;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/office-locations")]
public class OfficeLocationsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetOfficeLocationsQuery(), ct);
        return Ok(ApiResponse<List<OfficeLocationDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
    public async Task<IActionResult> Save([FromBody] SaveOfficeLocationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<OfficeLocationDto>.Ok(result, "Lưu địa điểm văn phòng thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteOfficeLocationCommand(id), ct);
        return Ok(ApiResponse.Ok("Xóa địa điểm văn phòng thành công."));
    }
}
