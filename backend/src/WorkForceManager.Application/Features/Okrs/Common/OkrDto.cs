using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Okrs.Common;

public record KeyResultDto(
    int Id,
    string Title,
    decimal TargetValue,
    decimal CurrentValue,
    string? Unit,
    decimal Weight,
    decimal Progress);

public record OkrObjectiveDto(
    int Id,
    string Title,
    string? Description,
    string OwnerType,
    int? DepartmentId,
    string? DepartmentName,
    int? EmployeeId,
    string? EmployeeName,
    string Period,
    string Status,
    decimal Progress,
    IReadOnlyList<KeyResultDto> KeyResults);

public static class OkrMapping
{
    public static decimal ToProgress(this KeyResult kr)
    {
        if (kr.TargetValue == 0)
        {
            return 0;
        }

        var raw = kr.CurrentValue / kr.TargetValue * 100m;
        return Math.Clamp(raw, 0m, 100m);
    }

    public static KeyResultDto ToDto(this KeyResult kr) => new(
        kr.Id,
        kr.Title,
        kr.TargetValue,
        kr.CurrentValue,
        kr.Unit,
        kr.Weight,
        Math.Round(kr.ToProgress(), 2));

    public static decimal ToOverallProgress(this OkrObjective objective)
    {
        if (objective.KeyResults.Count == 0)
        {
            return 0;
        }

        var totalWeight = objective.KeyResults.Sum(k => k.Weight);
        if (totalWeight <= 0)
        {
            return Math.Round(objective.KeyResults.Average(k => k.ToProgress()), 2);
        }

        var weighted = objective.KeyResults.Sum(k => k.ToProgress() * k.Weight) / totalWeight;
        return Math.Round(weighted, 2);
    }

    public static OkrObjectiveDto ToDto(this OkrObjective o) => new(
        o.Id,
        o.Title,
        o.Description,
        o.OwnerType.ToString(),
        o.DepartmentId,
        o.Department?.Name,
        o.EmployeeId,
        o.Employee?.FullName,
        o.Period,
        o.Status.ToString(),
        o.ToOverallProgress(),
        o.KeyResults.OrderBy(k => k.Id).Select(k => k.ToDto()).ToList());
}
