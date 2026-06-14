using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Overtime.Commands.ApproveOvertime;
using WorkForceManager.Application.Features.Overtime.Commands.CreateOvertimeRequest;
using WorkForceManager.Application.Features.Overtime.Commands.RejectOvertime;
using WorkForceManager.Application.Features.Overtime.Common;
using WorkForceManager.Application.Features.Overtime.Queries.GetMyOvertime;
using WorkForceManager.Application.Features.Overtime.Queries.GetOvertimeRequests;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/overtime")]
public class OvertimeController : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOvertimeRequestCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<OvertimeRequestDto>.Ok(result, "Gửi đơn làm thêm giờ thành công."));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyOvertimeQuery(), ct);
        return Ok(ApiResponse<List<OvertimeRequestDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.RequireManager)]
    public async Task<IActionResult> GetAll([FromQuery] GetOvertimeRequestsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<OvertimeRequestDto>>.Ok(result));
    }

    [HttpPost("{id:int}/approve")]
    [Authorize(Policy = AuthorizationPolicies.CanApproveOvertime)]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new ApproveOvertimeCommand(id), ct);
        return Ok(ApiResponse<OvertimeRequestDto>.Ok(result, "Duyệt đơn làm thêm giờ thành công."));
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Policy = AuthorizationPolicies.CanApproveOvertime)]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectOvertimeRequestDto request, CancellationToken ct)
    {
        var result = await Mediator.Send(new RejectOvertimeCommand(id, request.RejectReason), ct);
        return Ok(ApiResponse<OvertimeRequestDto>.Ok(result, "Từ chối đơn làm thêm giờ thành công."));
    }
}

public record RejectOvertimeRequestDto(string? RejectReason);
