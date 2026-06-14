namespace WorkForceManager.Application.Features.Dashboard.Common;

public record WeeklyProgressDto(
    string Day,
    int Completed,
    int InProgress);
