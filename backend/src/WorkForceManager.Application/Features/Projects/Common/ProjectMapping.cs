using WorkForceManager.Domain.Entities;

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
            members);
    }
}
