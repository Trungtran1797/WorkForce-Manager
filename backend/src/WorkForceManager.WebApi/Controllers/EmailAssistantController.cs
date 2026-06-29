using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.EmailAssistant.Commands;
using WorkForceManager.Application.Features.EmailAssistant.Queries;
using WorkForceManager.Application.Features.EmailAssistant.Dto;

using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize(Policy = AuthorizationPolicies.RequireManager)]
[Route("api/v1/email-assistant")]
public class EmailAssistantController : ApiControllerBase
{
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUserEmailConfigQuery(), ct);
        return Ok(ApiResponse<UserEmailConfigDto?>.Ok(result));
    }

    [HttpPost("config")]
    public async Task<IActionResult> SaveConfig([FromBody] SaveUserEmailConfigCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        if (!result)
        {
            return BadRequest(ApiResponse<bool>.Fail("Không thể kết nối đến hòm thư với cấu hình đã cung cấp. Vui lòng kiểm tra lại địa chỉ hòm thư, host, port hoặc mật khẩu/token."));
        }
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpDelete("config")]
    public async Task<IActionResult> DisconnectConfig(CancellationToken ct)
    {
        var result = await Mediator.Send(new DisconnectUserEmailConfigCommand(), ct);
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpGet("emails")]
    public async Task<IActionResult> GetEmails([FromQuery] string? query, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetEmailMessagesQuery { Query = query, Limit = limit }, ct);
        return Ok(ApiResponse<List<EmailMessageDto>>.Ok(result));
    }

    [HttpGet("emails/{id}")]
    public async Task<IActionResult> GetEmailDetail(string id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetEmailMessageDetailQuery { MessageId = id }, ct);
        if (result == null)
        {
            return NotFound(ApiResponse<EmailMessageDto?>.Fail("Không tìm thấy chi tiết email yêu cầu."));
        }
        return Ok(ApiResponse<EmailMessageDto?>.Ok(result));
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatWithEmailAssistantCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<string>.Ok(result));
    }

    [AllowAnonymous]
    [HttpGet("attachment")]
    public async Task<IActionResult> DownloadAttachment(
        [FromQuery] string messageId, 
        [FromQuery] string? partSpecifier, 
        [FromQuery] string? attachmentId, 
        [FromQuery] string fileName, 
        [FromQuery] int? userId, 
        CancellationToken ct)
    {
        var result = await Mediator.Send(new DownloadEmailAttachmentQuery 
        { 
            MessageId = messageId, 
            PartSpecifier = partSpecifier, 
            AttachmentId = attachmentId, 
            UserId = userId 
        }, ct);

        if (result == null)
        {
            return NotFound("Không tìm thấy tệp đính kèm hoặc kết nối hòm thư thất bại.");
        }

        return File(result.Content, result.ContentType, result.FileName);
    }
}
