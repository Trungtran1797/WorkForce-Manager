using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Queries.GetProjects;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Projects
            .AsNoTracking()
            .Include(p => p.Members)
            .ThenInclude(m => m.Employee)
            .AsQueryable();

        if (!request.IncludeTemplates)
            query = query.Where(p => !p.IsTemplate);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(p => p.Name.Contains(term) || p.Code.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<ProjectStatus>(request.Status, out var status))
        {
            query = query.Where(p => p.Status == status);
        }

        var projects = await query.OrderByDescending(p => p.CreatedDate).ToListAsync(cancellationToken);
        return projects.Select(p => p.ToDto()).ToList();
    }
}
