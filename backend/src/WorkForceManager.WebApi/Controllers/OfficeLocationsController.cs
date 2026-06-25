using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.OfficeLocations.Commands.DeleteOfficeLocation;
using WorkForceManager.Application.Features.OfficeLocations.Commands.SaveOfficeLocation;
using WorkForceManager.Application.Features.OfficeLocations.Common;
using WorkForceManager.Application.Features.OfficeLocations.Queries.GetOfficeLocations;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/office-locations")]
public class OfficeLocationsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.OfficeLocations) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetOfficeLocationsQuery(), ct);
        return Ok(ApiResponse<List<OfficeLocationDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.OfficeLocations) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Save([FromBody] SaveOfficeLocationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<OfficeLocationDto>.Ok(result, "Lưu địa điểm văn phòng thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.OfficeLocations) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteOfficeLocationCommand(id), ct);
        return Ok(ApiResponse.Ok("Xóa địa điểm văn phòng thành công."));
    }
}
