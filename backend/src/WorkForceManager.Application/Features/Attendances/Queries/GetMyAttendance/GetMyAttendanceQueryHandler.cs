using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Queries.GetMyAttendance;

public class GetMyAttendanceQueryHandler : IRequestHandler<GetMyAttendanceQuery, List<AttendanceDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyAttendanceQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<AttendanceDto>> Handle(GetMyAttendanceQuery request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null or 0)
            return [];

        var attendances = await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.Date)
            .ToListAsync(cancellationToken);

        return attendances.Select(a => a.ToDto()).ToList();
    }
}
