using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Commands.UpdateProject;

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateProjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Members)
            .ThenInclude(m => m.Employee)
            .Include(p => p.Attachments)
            .ThenInclude(a => a.UploadedBy)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.Id);

        if (!string.IsNullOrWhiteSpace(request.Code))
            project.Code = request.Code.Trim();
        project.Name = request.Name.Trim();
        project.Investor = request.Investor?.Trim();
        project.StartDate = DateTime.Parse(request.StartDate);
        project.EndDate = DateTime.Parse(request.EndDate);
        project.Status = Enum.Parse<ProjectStatus>(request.Status);
        project.Budget = request.Budget;
        project.Description = request.Description?.Trim();
        project.Progress = request.Progress;
        project.ShippingDate = string.IsNullOrEmpty(request.ShippingDate) ? null : DateTime.Parse(request.ShippingDate);

        await _context.SaveChangesAsync(cancellationToken);

        return project.ToDto();
    }
}
