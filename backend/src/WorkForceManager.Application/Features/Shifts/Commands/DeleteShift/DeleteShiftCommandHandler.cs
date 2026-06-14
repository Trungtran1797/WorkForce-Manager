using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Shifts.Commands.DeleteShift;

public class DeleteShiftCommandHandler : IRequestHandler<DeleteShiftCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteShiftCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = await _context.Shifts
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Ca làm việc", request.Id);

        // Soft delete tự động qua AuditableEntitySaveChangesInterceptor.
        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
