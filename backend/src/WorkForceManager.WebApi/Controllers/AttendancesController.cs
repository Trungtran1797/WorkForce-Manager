using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Attendances.Commands.CheckIn;
using WorkForceManager.Application.Features.Attendances.Commands.CheckOut;
using WorkForceManager.Application.Features.Attendances.Common;
using WorkForceManager.Application.Features.Attendances.Queries.GetMyAttendance;
using WorkForceManager.Application.Features.Attendances.Queries.GetAttendances;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/attendances")]
public class AttendancesController : ApiControllerBase
{
    [HttpPost("check-in")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Attendance) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request, CancellationToken ct)
    {
        var result = await Mediator.Send(new CheckInCommand(request.Note, request.Latitude, request.Longitude), ct);
        return Ok(ApiResponse<AttendanceDto>.Ok(result, "Check-in thành công."));
    }

    [HttpPost("check-out")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Attendance) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequestDto request, CancellationToken ct)
    {
        var result = await Mediator.Send(new CheckOutCommand(request.Note), ct);
        return Ok(ApiResponse<AttendanceDto>.Ok(result, "Check-out thành công."));
    }

    [HttpGet("my")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Attendance) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyAttendanceQuery(), ct);
        return Ok(ApiResponse<List<AttendanceDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Attendance) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] GetAttendancesQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<AttendanceDto>>.Ok(result));
    }
}

public record CheckInRequestDto(string? Note, double? Latitude = null, double? Longitude = null);
public record CheckOutRequestDto(string? Note);
