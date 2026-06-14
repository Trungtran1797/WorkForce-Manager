namespace WorkForceManager.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendNotificationToUserAsync(int userId, string title, string message, string type, string? link, CancellationToken ct = default);
    Task SendNotificationToRoleAsync(string roleName, string title, string message, string type, string? link, CancellationToken ct = default);
    Task SendNotificationToAllAsync(string title, string message, string type, string? link, CancellationToken ct = default);
}
