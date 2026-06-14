using MediatR;
using WorkForceManager.Application.Features.Okrs.Common;

namespace WorkForceManager.Application.Features.Okrs.Queries.GetOkrs;

/// <summary>Lấy danh sách mục tiêu OKR theo kỳ, có thể lọc theo phòng ban hoặc cá nhân.</summary>
public record GetOkrsQuery(string? Period, int? DepartmentId, int? EmployeeId, string? OwnerType) : IRequest<List<OkrObjectiveDto>>;
