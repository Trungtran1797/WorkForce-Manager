using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Contracts.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Contracts.Queries.GetContracts;

public class GetContractsQueryHandler : IRequestHandler<GetContractsQuery, PaginatedList<ContractDto>>
{
    private readonly IApplicationDbContext _context;

    public GetContractsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<ContractDto>> Handle(GetContractsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.EmploymentContracts
            .AsNoTracking()
            .Include(c => c.Employee)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(c => c.ContractCode.Contains(term) || c.Employee!.FullName.Contains(term));
        }

        if (request.EmployeeId is { } empId)
        {
            query = query.Where(c => c.EmployeeId == empId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<ContractStatus>(request.Status, out var status))
        {
            query = query.Where(c => c.Status == status);
        }

        query = query.OrderByDescending(c => c.StartDate).ThenByDescending(c => c.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<ContractDto>(
            items.Select(c => c.ToDto()).ToList(), totalCount, request.PageNumber, request.PageSize);
    }
}
