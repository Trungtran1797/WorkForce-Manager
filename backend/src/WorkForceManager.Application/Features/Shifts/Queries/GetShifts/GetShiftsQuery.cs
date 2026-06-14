using MediatR;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Queries.GetShifts;

/// <summary>Lấy toàn bộ ca làm việc (danh sách ngắn, không phân trang).</summary>
public record GetShiftsQuery(bool? OnlyActive = null) : IRequest<List<ShiftDto>>;
