using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Shifts.Common;

namespace WorkForceManager.Application.Features.Shifts.Queries.GetShifts;

public class GetShiftsQueryHandler : IRequestHandler<GetShiftsQuery, List<ShiftDto>>
{
    private readonly IApplicationDbContext _context;

    public GetShiftsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShiftDto>> Handle(GetShiftsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Shifts.AsNoTracking().AsQueryable();

        if (request.OnlyActive == true)
        {
            query = query.Where(s => s.IsActive);
        }

        var shifts = await query
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);

        return shifts.Select(s => s.ToDto()).ToList();
    }
}
