using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.TaxBrackets.GetTaxBrackets;

public class GetTaxBracketsQueryHandler : IRequestHandler<GetTaxBracketsQuery, List<TaxBracketDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTaxBracketsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaxBracketDto>> Handle(GetTaxBracketsQuery request, CancellationToken cancellationToken)
    {
        return await _context.TaxBrackets
            .AsNoTracking()
            .OrderBy(t => t.Order)
            .Select(t => new TaxBracketDto(t.Order, t.FromAmount, t.ToAmount, t.Rate))
            .ToListAsync(cancellationToken);
    }
}
