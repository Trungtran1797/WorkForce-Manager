using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.SalaryConfigs.Common;

namespace WorkForceManager.Application.Features.SalaryConfigs.Queries.GetSalaryConfigs;

public class GetSalaryConfigsQueryHandler : IRequestHandler<GetSalaryConfigsQuery, List<SalaryConfigDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSalaryConfigsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SalaryConfigDto>> Handle(GetSalaryConfigsQuery request, CancellationToken cancellationToken)
    {
        var configs = await _context.SalaryConfigs
            .AsNoTracking()
            .Include(s => s.Employee)
            .OrderBy(s => s.Employee!.FullName)
            .ToListAsync(cancellationToken);

        return configs.Select(s => s.ToDto()).ToList();
    }
}
