using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Settings.Commands.UpdateSystemSetting;
using WorkForceManager.Application.Features.Settings.Queries.GetSystemSettings;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize(Policy = AuthorizationPolicies.RequireSuperAdmin)]
[Route("api/v1/system-settings")]
public class SystemSettingsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSystemSettingsQuery(), ct);
        return Ok(ApiResponse<List<SystemSettingDto>>.Ok(result));
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateSystemSettingRequest body, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateSystemSettingCommand(key, body.Value), ct);
        return Ok(result);
    }
}

public record UpdateSystemSettingRequest(string Value);
