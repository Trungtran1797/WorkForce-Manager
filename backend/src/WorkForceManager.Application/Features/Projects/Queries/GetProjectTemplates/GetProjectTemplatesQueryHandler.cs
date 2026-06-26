using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Queries.GetProjectTemplates;

public class GetProjectTemplatesQueryHandler : IRequestHandler<GetProjectTemplatesQuery, List<ProjectTemplateDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectTemplatesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectTemplateDto>> Handle(GetProjectTemplatesQuery request, CancellationToken cancellationToken)
    {
        var templates = await _context.Projects
            .Include(p => p.Members)
            .Where(p => p.IsTemplate)
            .OrderBy(p => p.Id)
            .ToListAsync(cancellationToken);

        var result = new List<ProjectTemplateDto>();

        foreach (var t in templates)
        {
            var taskCount = await _context.Tasks
                .CountAsync(tk => tk.ProjectId == t.Id, cancellationToken);

            result.Add(t.ToTemplateDto(taskCount));
        }

        return result;
    }
}
