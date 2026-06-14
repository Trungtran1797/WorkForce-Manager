using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.OfficeLocations.Common;

namespace WorkForceManager.Application.Features.OfficeLocations.Queries.GetOfficeLocations;

public class GetOfficeLocationsQueryHandler : IRequestHandler<GetOfficeLocationsQuery, List<OfficeLocationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOfficeLocationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OfficeLocationDto>> Handle(GetOfficeLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await _context.OfficeLocations
            .AsNoTracking()
            .OrderBy(l => l.Name)
            .ToListAsync(cancellationToken);

        return locations.Select(l => l.ToDto()).ToList();
    }
}
