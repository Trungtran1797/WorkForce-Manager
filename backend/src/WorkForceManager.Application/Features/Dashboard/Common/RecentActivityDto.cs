namespace WorkForceManager.Application.Features.Dashboard.Common;

public record RecentActivityDto(
    string Id,
    string Actor,
    string Action,
    string Timestamp,
    string Type);
