using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Queries.GetAttendances;

public class GetAttendancesQuery : PaginationRequest, IRequest<PaginatedList<AttendanceDto>>
{
    public int? DepartmentId { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}
