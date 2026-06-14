using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Contracts.Commands.DeleteContract;

public class DeleteContractCommandHandler : IRequestHandler<DeleteContractCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteContractCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _context.EmploymentContracts
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Hợp đồng", request.Id);

        _context.EmploymentContracts.Remove(contract);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
