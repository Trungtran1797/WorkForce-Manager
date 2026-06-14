using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.OfficeLocations.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.OfficeLocations.Commands.SaveOfficeLocation;

public class SaveOfficeLocationCommandHandler : IRequestHandler<SaveOfficeLocationCommand, OfficeLocationDto>
{
    private readonly IApplicationDbContext _context;

    public SaveOfficeLocationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OfficeLocationDto> Handle(SaveOfficeLocationCommand request, CancellationToken cancellationToken)
    {
        OfficeLocation location;

        if (request.Id > 0)
        {
            location = await _context.OfficeLocations
                .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException("Địa điểm văn phòng", request.Id);
        }
        else
        {
            location = new OfficeLocation();
            _context.OfficeLocations.Add(location);
        }

        location.Name = request.Name.Trim();
        location.AllowedIpRanges = string.IsNullOrWhiteSpace(request.AllowedIpRanges) ? null : request.AllowedIpRanges.Trim();
        location.Latitude = request.Latitude;
        location.Longitude = request.Longitude;
        location.RadiusMeters = request.RadiusMeters;
        location.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return location.ToDto();
    }
}
