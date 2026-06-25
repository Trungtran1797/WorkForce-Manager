using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Notifications.Commands.MarkAllNotificationsAsRead;
using WorkForceManager.Application.Features.Notifications.Commands.MarkNotificationAsRead;
using WorkForceManager.Application.Features.Notifications.Common;
using WorkForceManager.Application.Features.Notifications.Queries.GetNotifications;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/notifications")]
public class NotificationsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Notifications) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetNotificationsQuery(), ct);
        return Ok(ApiResponse<List<NotificationDto>>.Ok(result));
    }

    [HttpPut("{id}/read")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Notifications) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new MarkNotificationAsReadCommand(id), ct);
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpPut("read-all")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Notifications) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var result = await Mediator.Send(new MarkAllNotificationsAsReadCommand(), ct);
        return Ok(ApiResponse<bool>.Ok(result));
    }
}
