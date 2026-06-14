using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.LeaveRequests.Commands.ApproveLeaveRequest;
using WorkForceManager.Application.Features.LeaveRequests.Commands.CreateLeaveRequest;
using WorkForceManager.Application.Features.LeaveRequests.Commands.RejectLeaveRequest;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Application.Features.LeaveRequests.Queries.GetMyLeaveRequests;
using WorkForceManager.Application.Features.LeaveRequests.Queries.GetPendingLeaveRequests;
using WorkForceManager.Application.Features.LeaveRequests.Queries.GetLeaveRequests;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/leave-requests")]
public class LeaveRequestsController : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeaveRequestCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<LeaveRequestDto>.Ok(result, "Gửi đơn xin nghỉ phép thành công."));
    }

    [HttpPost("{id:int}/approve")]
    [Authorize(Policy = AuthorizationPolicies.RequireManager)]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new ApproveLeaveRequestCommand(id), ct);
        return Ok(ApiResponse<LeaveRequestDto>.Ok(result, "Duyệt đơn nghỉ phép thành công."));
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Policy = AuthorizationPolicies.RequireManager)]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectLeaveRequestRequestDto request, CancellationToken ct)
    {
        var result = await Mediator.Send(new RejectLeaveRequestCommand(id, request.Reason), ct);
        return Ok(ApiResponse<LeaveRequestDto>.Ok(result, "Từ chối đơn nghỉ phép thành công."));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyLeaveRequestsQuery(), ct);
        return Ok(ApiResponse<List<LeaveRequestDto>>.Ok(result));
    }

    [HttpGet("pending")]
    [Authorize(Policy = AuthorizationPolicies.RequireManager)]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPendingLeaveRequestsQuery(), ct);
        return Ok(ApiResponse<List<LeaveRequestDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.RequireManager)]
    public async Task<IActionResult> GetAll([FromQuery] GetLeaveRequestsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<LeaveRequestDto>>.Ok(result));
    }
}

public record RejectLeaveRequestRequestDto(string Reason);
