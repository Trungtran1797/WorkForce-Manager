namespace WorkForceManager.Application.Features.Notifications.Common;

public record NotificationDto(
    int Id,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    string? Link,
    DateTime CreatedAt);
