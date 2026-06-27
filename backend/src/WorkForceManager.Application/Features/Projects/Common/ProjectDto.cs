using WorkForceManager.Application.Features.Projects.Discussions.Common;

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
    List<ProjectMemberDto> Members,
    string? ShippingDate,
    bool IsTemplate = false,
    List<ProjectAttachmentDto>? Attachments = null);

public record ProjectTemplateDto(
    int Id,
    string Code,
    string Name,
    string Description,
    int DurationDays,
    int TaskCount,
    List<string> DepartmentRoles);
