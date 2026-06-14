namespace WorkForceManager.Application.Features.Projects.Common;

public record ProjectMemberDto(
    int Id,
    int EmployeeId,
    string Name,
    string Role,
    string AvatarColor);

public record ProjectDto(
    int Id,
    string Code,
    string Name,
    string Investor,
    string StartDate,
    string EndDate,
    string Status,
    decimal Budget,
    string Description,
    int Progress,
    List<ProjectMemberDto> Members);
