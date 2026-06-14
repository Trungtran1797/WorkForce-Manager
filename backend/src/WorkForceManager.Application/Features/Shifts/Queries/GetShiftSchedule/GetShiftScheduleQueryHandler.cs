using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Queries.GetShiftSchedule;

public class GetShiftScheduleQueryHandler : IRequestHandler<GetShiftScheduleQuery, List<ShiftAssignmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetShiftScheduleQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShiftAssignmentDto>> Handle(GetShiftScheduleQuery request, CancellationToken cancellationToken)
    {
        var start = DateTime.Parse(request.StartDate).Date;
        var end = DateTime.Parse(request.EndDate).Date;

        var query = _context.ShiftAssignments
            .AsNoTracking()
            .Include(a => a.Employee)
            .Include(a => a.Shift)
            .Where(a => a.WorkDate >= start && a.WorkDate <= end);

        if (request.EmployeeId is { } empId)
        {
            query = query.Where(a => a.EmployeeId == empId);
        }

        if (request.DepartmentId is { } deptId)
        {
            query = query.Where(a => a.Employee!.DepartmentId == deptId);
        }

        var assignments = await query
            .OrderBy(a => a.WorkDate)
            .ThenBy(a => a.Employee!.FullName)
            .ToListAsync(cancellationToken);

        return assignments.Select(a => a.ToDto()).ToList();
    }
}
