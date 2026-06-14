using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Okrs.Commands.DeleteObjective;

public class DeleteObjectiveCommandHandler : IRequestHandler<DeleteObjectiveCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteObjectiveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteObjectiveCommand request, CancellationToken cancellationToken)
    {
        var objective = await _context.OkrObjectives
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Mục tiêu OKR", request.Id);

        _context.OkrObjectives.Remove(objective);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
