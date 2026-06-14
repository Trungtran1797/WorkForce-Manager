using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WorkForceManager.Infrastructure.Notifications.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, role);
        }

        var deptClaim = Context.User?.FindFirst("deptId")?.Value;
        if (!string.IsNullOrEmpty(deptClaim))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"dept_{deptClaim}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, role);
        }

        var deptClaim = Context.User?.FindFirst("deptId")?.Value;
        if (!string.IsNullOrEmpty(deptClaim))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"dept_{deptClaim}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
