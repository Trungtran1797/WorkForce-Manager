using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Commands.CreateProjectFromTemplate;

public class CreateProjectFromTemplateCommandHandler : IRequestHandler<CreateProjectFromTemplateCommand, ProjectDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IProjectFolderService _projectFolderService;

    public CreateProjectFromTemplateCommandHandler(IApplicationDbContext context, IProjectFolderService projectFolderService)
    {
        _context = context;
        _projectFolderService = projectFolderService;
    }

    public async Task<ProjectDto> Handle(CreateProjectFromTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await _context.Projects
            .Include(p => p.Members)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == request.TemplateId && p.IsTemplate, cancellationToken)
            ?? throw new NotFoundException("Template dự án", request.TemplateId);

        var newStart = DateTime.Parse(request.StartDate);
        var duration = template.EndDate - template.StartDate;
        var newEnd = newStart + duration;
        var dateOffset = newStart - template.StartDate;

        // Sinh mã dự án tự động nếu không cung cấp
        var code = request.Code?.Trim();
        if (string.IsNullOrEmpty(code))
        {
            var yearSuffix = (newStart.Year % 100).ToString("D2");
            var prefix = $"{yearSuffix}-";
            var existingCodes = await _context.Projects
                .Where(p => p.Code.StartsWith(prefix))
                .Select(p => p.Code)
                .ToListAsync(cancellationToken);

            int nextIndex = 1;
            if (existingCodes.Any())
            {
                var maxIndex = existingCodes
                    .Select(c => c[prefix.Length..])
                    .Select(s => int.TryParse(s, out var n) ? n : 0)
                    .Max();
                nextIndex = maxIndex + 1;
            }
            code = $"{prefix}{nextIndex:D3}";
        }

        // Tạo dự án mới
        var project = new Project
        {
            Code = code,
            Name = request.Name.Trim(),
            Investor = request.Investor?.Trim() ?? template.Investor,
            StartDate = newStart,
            EndDate = newEnd,
            Status = ProjectStatus.Planning,
            Budget = request.Budget,
            Description = string.IsNullOrEmpty(request.Description) ? null : request.Description.Trim(),
            Progress = 0,
            IsTemplate = false,
            ShippingDate = string.IsNullOrEmpty(request.ShippingDate)
                ? (template.ShippingDate.HasValue ? template.ShippingDate.Value + dateOffset : null)
                : DateTime.Parse(request.ShippingDate),
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);

        // Sao chép thành viên từ template
        foreach (var m in template.Members.OrderBy(x => x.Id))
        {
            _context.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = project.Id,
                EmployeeId = m.EmployeeId,
                RoleInProject = m.RoleInProject,
                JoinedDate = newStart,
            });
        }
        await _context.SaveChangesAsync(cancellationToken);

        // Sao chép tasks: thứ tự cha trước (ParentTaskId null → ưu tiên cao hơn)
        var templateTasks = await _context.Tasks
            .Where(t => t.ProjectId == template.Id)
            .OrderBy(t => t.ParentTaskId == null ? 0 : 1)
            .ThenBy(t => t.Id)
            .ToListAsync(cancellationToken);

        var idMap = new Dictionary<int, int>(); // old ID → new ID

        foreach (var src in templateTasks)
        {
            var newTask = new TaskItem
            {
                Code = src.Code,
                Title = src.Title,
                Description = src.Description,
                AssigneeId = src.AssigneeId,
                AssignerId = src.AssignerId,
                Priority = src.Priority,
                Status = WorkTaskStatus.Todo,
                Progress = 0,
                ProjectId = project.Id,
                StartDate = src.StartDate.HasValue ? src.StartDate.Value + dateOffset : null,
                DueDate = src.DueDate.HasValue ? src.DueDate.Value + dateOffset : null,
            };

            _context.Tasks.Add(newTask);
            await _context.SaveChangesAsync(cancellationToken);

            idMap[src.Id] = newTask.Id;
        }

        // Gán ParentTaskId theo mapping
        foreach (var src in templateTasks.Where(t => t.ParentTaskId != null))
        {
            if (!idMap.TryGetValue(src.ParentTaskId!.Value, out var newParentId)) continue;
            var newTask = await _context.Tasks.FindAsync([idMap[src.Id]], cancellationToken);
            if (newTask != null) newTask.ParentTaskId = newParentId;
        }
        await _context.SaveChangesAsync(cancellationToken);

        await _projectFolderService.CreateProjectFolderAsync(project.Code, project.Name);

        var created = await _context.Projects
            .Include(p => p.Members).ThenInclude(m => m.Employee)
            .FirstAsync(p => p.Id == project.Id, cancellationToken);

        return created.ToDto();
    }
}
