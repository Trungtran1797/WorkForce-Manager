using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Okrs.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Okrs.Commands.UpdateKeyResultProgress;

public class UpdateKeyResultProgressCommandHandler : IRequestHandler<UpdateKeyResultProgressCommand, OkrObjectiveDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateKeyResultProgressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OkrObjectiveDto> Handle(UpdateKeyResultProgressCommand request, CancellationToken cancellationToken)
    {
        var keyResult = await _context.KeyResults
            .Include(k => k.Objective)
            .ThenInclude(o => o!.KeyResults)
            .FirstOrDefaultAsync(k => k.Id == request.KeyResultId, cancellationToken)
            ?? throw new NotFoundException("Key Result", request.KeyResultId);

        keyResult.CurrentValue = request.CurrentValue;

        var objective = keyResult.Objective!;
        if (objective.Status == OkrStatus.Active && objective.ToOverallProgress() >= 100m)
        {
            objective.Status = OkrStatus.Achieved;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.OkrObjectives
            .AsNoTracking()
            .Include(o => o.Department)
            .Include(o => o.Employee)
            .Include(o => o.KeyResults)
            .FirstAsync(o => o.Id == objective.Id, cancellationToken);

        return saved.ToDto();
    }
}
