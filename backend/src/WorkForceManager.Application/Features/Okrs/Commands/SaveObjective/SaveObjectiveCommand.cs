using MediatR;
using WorkForceManager.Application.Features.Okrs.Common;

namespace WorkForceManager.Application.Features.Okrs.Commands.SaveObjective;

/// <summary>Một Key Result trong yêu cầu lưu Objective. Id = 0 → tạo mới, Id &gt; 0 → cập nhật.</summary>
public record KeyResultInput(
    int Id,
    string Title,
    decimal TargetValue,
    decimal CurrentValue,
    string? Unit,
    decimal Weight);

/// <summary>Tạo mới (Id = 0) hoặc cập nhật (Id &gt; 0) một mục tiêu OKR kèm danh sách Key Results.</summary>
public record SaveObjectiveCommand(
    int Id,
    string Title,
    string? Description,
    string OwnerType,
    int? DepartmentId,
    int? EmployeeId,
    string Period,
    string Status,
    IReadOnlyList<KeyResultInput> KeyResults) : IRequest<OkrObjectiveDto>;
