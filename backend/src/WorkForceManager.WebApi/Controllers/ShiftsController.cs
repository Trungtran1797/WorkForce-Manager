using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Shifts.Commands.AssignShift;
using WorkForceManager.Application.Features.Shifts.Commands.CreateShift;
using WorkForceManager.Application.Features.Shifts.Commands.DeleteShift;
using WorkForceManager.Application.Features.Shifts.Commands.UpdateShift;
using WorkForceManager.Application.Features.Shifts.Common;
using WorkForceManager.Application.Features.Shifts.Queries.GetShiftSchedule;
using WorkForceManager.Application.Features.Shifts.Queries.GetShifts;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/shifts")]
public class ShiftsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] bool? onlyActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetShiftsQuery(onlyActive), ct);
        return Ok(ApiResponse<List<ShiftDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateShiftCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ShiftDto>.Ok(result, "Tạo ca làm việc thành công."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShiftCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<ShiftDto>.Ok(result, "Cập nhật ca làm việc thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteShiftCommand(id), ct);
        return Ok(ApiResponse.Ok("Xóa ca làm việc thành công."));
    }

    [HttpGet("schedule")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetSchedule([FromQuery] GetShiftScheduleQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<List<ShiftAssignmentDto>>.Ok(result));
    }

    [HttpPost("assign")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Shifts) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Assign([FromBody] AssignShiftCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ShiftAssignmentDto>.Ok(result, "Phân ca thành công."));
    }
}
