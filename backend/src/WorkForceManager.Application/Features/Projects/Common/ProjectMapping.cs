using WorkForceManager.Domain.Entities;
using WorkForceManager.Application.Features.Projects.Discussions.Common;

namespace WorkForceManager.Application.Features.Projects.Common;

public static class ProjectMapping
{
    private const string DateFormat = "yyyy-MM-dd";
    private static readonly string[] AvatarColors = ["primary", "success", "warning", "destructive", "gray"];

    public static string AvatarColorForIndex(int index) => AvatarColors[index % AvatarColors.Length];

    public static ProjectDto ToDto(this Project p)
    {
        var members = p.Members
            .OrderBy(m => m.Id)
            .Select((m, index) => new ProjectMemberDto(
                m.Id,
                m.EmployeeId,
                m.Employee?.FullName ?? string.Empty,
                m.RoleInProject,
                AvatarColorForIndex(index)))
            .ToList();

        var attachments = p.Attachments?
            .OrderBy(a => a.Id)
            .Select(a => a.ToDto())
            .ToList() ?? new List<ProjectAttachmentDto>();

        return new ProjectDto(
            p.Id,
            p.Code,
            p.Name,
            p.Investor ?? string.Empty,
            p.StartDate.ToString(DateFormat),
            p.EndDate.ToString(DateFormat),
            p.Status.ToString(),
            p.Budget,
            p.Description ?? string.Empty,
            p.Progress,
            members,
            p.ShippingDate?.ToString(DateFormat),
            p.IsTemplate,
            attachments);
    }

    public static ProjectTemplateDto ToTemplateDto(this Project p, int taskCount)
    {
        var duration = (int)(p.EndDate - p.StartDate).TotalDays;
        var roles = p.Members
            .OrderBy(m => m.Id)
            .Select(m => m.RoleInProject)
            .Where(r => !string.IsNullOrEmpty(r))
            .ToList();

        return new ProjectTemplateDto(
            p.Id,
            p.Code,
            p.Name,
            p.Description ?? string.Empty,
            duration,
            taskCount,
            roles);
    }
}
