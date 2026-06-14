using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.OfficeLocations.Commands.DeleteOfficeLocation;

public class DeleteOfficeLocationCommandHandler : IRequestHandler<DeleteOfficeLocationCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteOfficeLocationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteOfficeLocationCommand request, CancellationToken cancellationToken)
    {
        var location = await _context.OfficeLocations
            .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Địa điểm văn phòng", request.Id);

        _context.OfficeLocations.Remove(location);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
