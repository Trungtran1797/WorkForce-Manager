using MediatR;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Queries.GetShiftSchedule;

/// <summary>Lấy lịch phân ca trong khoảng ngày, tùy chọn lọc theo nhân viên/phòng ban.</summary>
public record GetShiftScheduleQuery(
    string StartDate,
    string EndDate,
    int? EmployeeId = null,
    int? DepartmentId = null) : IRequest<List<ShiftAssignmentDto>>;
