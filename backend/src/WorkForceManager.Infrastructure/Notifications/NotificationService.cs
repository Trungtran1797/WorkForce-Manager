using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Notifications.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Infrastructure.Notifications.Hubs;

namespace WorkForceManager.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IDateTimeService _dateTimeService;

    public NotificationService(
        IApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        IDateTimeService dateTimeService)
    {
        _context = context;
        _hubContext = hubContext;
        _dateTimeService = dateTimeService;
    }

    public async Task SendNotificationToUserAsync(int userId, string title, string message, string type, string? link, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Link = link,
            IsRead = false,
            CreatedAt = _dateTimeService.Now
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var dto = new NotificationDto(
            notification.Id,
            notification.Title,
            notification.Message,
            notification.Type,
            notification.IsRead,
            notification.Link,
            notification.CreatedAt
        );

        await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", dto, cancellationToken: ct);
    }

    public async Task SendNotificationToRoleAsync(string roleName, string title, string message, string type, string? link, CancellationToken ct = default)
    {
        var users = await _context.Users
            .Where(u => u.Role.ToString() == roleName && u.IsActive)
            .ToListAsync(ct);

        var now = _dateTimeService.Now;

        foreach (var user in users)
        {
            var notification = new Notification
            {
                UserId = user.Id,
                Title = title,
                Message = message,
                Type = type,
                Link = link,
                IsRead = false,
                CreatedAt = now
            };

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(ct);

        await _hubContext.Clients.Group(roleName).SendAsync("ReceiveNotification", new NotificationDto(0, title, message, type, false, link, now), cancellationToken: ct);
    }

    public async Task SendNotificationToAllAsync(string title, string message, string type, string? link, CancellationToken ct = default)
    {
        var users = await _context.Users
            .Where(u => u.IsActive)
            .ToListAsync(ct);

        var now = _dateTimeService.Now;

        foreach (var user in users)
        {
            var notification = new Notification
            {
                UserId = user.Id,
                Title = title,
                Message = message,
                Type = type,
                Link = link,
                IsRead = false,
                CreatedAt = now
            };

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(ct);

        await _hubContext.Clients.All.SendAsync("ReceiveNotification", new NotificationDto(0, title, message, type, false, link, now), cancellationToken: ct);
    }
}
