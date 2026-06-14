using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Commands.CreateProject;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;

    public CreateProjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var startDate = DateTime.Parse(request.StartDate);
        var endDate = DateTime.Parse(request.EndDate);

        var code = request.Code?.Trim();

        if (string.IsNullOrEmpty(code))
        {
            // Sinh mã dự án tự động theo định dạng YY-XXX (Ví dụ: 26-001)
            var yearSuffix = (startDate.Year % 100).ToString("D2");
            var prefix = $"{yearSuffix}-";

            var existingCodes = await _context.Projects
                .Where(p => p.Code.StartsWith(prefix))
                .Select(p => p.Code)
                .ToListAsync(cancellationToken);

            int nextIndex = 1;
            if (existingCodes.Any())
            {
                var maxIndex = existingCodes
                    .Select(c => c.Substring(prefix.Length))
                    .Select(s => int.TryParse(s, out var num) ? num : 0)
                    .Max();
                nextIndex = maxIndex + 1;
            }

            code = $"{prefix}{nextIndex:D3}";
        }

        var project = new Project
        {
            Code = code,
            Name = request.Name.Trim(),
            Investor = request.Investor?.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            Status = Enum.Parse<ProjectStatus>(request.Status),
            Budget = request.Budget,
            Description = request.Description?.Trim(),
            Progress = request.Progress
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);

        return project.ToDto();
    }
}
