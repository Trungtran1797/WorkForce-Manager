using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Okrs.Commands.DeleteObjective;
using WorkForceManager.Application.Features.Okrs.Commands.SaveObjective;
using WorkForceManager.Application.Features.Okrs.Commands.UpdateKeyResultProgress;
using WorkForceManager.Application.Features.Okrs.Common;
using WorkForceManager.Application.Features.Okrs.Queries.GetOkrs;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/okrs")]
public class OkrsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetOkrsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<List<OkrObjectiveDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.CanManagePerformance)]
    public async Task<IActionResult> Save([FromBody] SaveObjectiveCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<OkrObjectiveDto>.Ok(result, "Lưu mục tiêu OKR thành công."));
    }

    [HttpPatch("key-results/{keyResultId:int}")]
    public async Task<IActionResult> UpdateProgress(int keyResultId, [FromBody] UpdateKeyResultProgressRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateKeyResultProgressCommand(keyResultId, request.CurrentValue), ct);
        return Ok(ApiResponse<OkrObjectiveDto>.Ok(result, "Cập nhật tiến độ thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePerformance)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteObjectiveCommand(id), ct);
        return Ok(ApiResponse.Ok("Xóa mục tiêu OKR thành công."));
    }
}

public record UpdateKeyResultProgressRequest(decimal CurrentValue);
