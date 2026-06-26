using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;

namespace WorkForceManager.Application.Features.Projects.Commands.MarkProjectAsTemplate;

public class MarkProjectAsTemplateCommandHandler : IRequestHandler<MarkProjectAsTemplateCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public MarkProjectAsTemplateCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(MarkProjectAsTemplateCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Members).ThenInclude(m => m.Employee)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.Id);

        project.IsTemplate = request.IsTemplate;
        await _context.SaveChangesAsync(cancellationToken);

        return project.ToDto();
    }
}
