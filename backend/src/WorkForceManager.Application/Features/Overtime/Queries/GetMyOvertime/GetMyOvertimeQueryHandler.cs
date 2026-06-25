using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Queries.GetMyOvertime;

public class GetMyOvertimeQueryHandler : IRequestHandler<GetMyOvertimeQuery, List<OvertimeRequestDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyOvertimeQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<OvertimeRequestDto>> Handle(GetMyOvertimeQuery request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null or 0)
            return [];

        var items = await _context.OvertimeRequests
            .AsNoTracking()
            .Include(o => o.Employee)
            .Include(o => o.Project)
            .Include(o => o.Task)
            .Where(o => o.EmployeeId == employeeId)
            .OrderByDescending(o => o.Date)
            .ThenByDescending(o => o.Id)
            .ToListAsync(cancellationToken);

        return items.Select(o => o.ToDto()).ToList();
    }
}
