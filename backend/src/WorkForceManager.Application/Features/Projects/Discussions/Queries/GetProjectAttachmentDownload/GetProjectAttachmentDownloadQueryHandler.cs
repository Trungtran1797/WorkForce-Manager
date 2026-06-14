using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectAttachmentDownload;

public class GetProjectAttachmentDownloadQueryHandler
    : IRequestHandler<GetProjectAttachmentDownloadQuery, ProjectAttachmentFileResult>
{
    private const string SubFolderPrefix = "projects";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public GetProjectAttachmentDownloadQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ProjectAttachmentFileResult> Handle(GetProjectAttachmentDownloadQuery request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;
        var isMember = employeeId.HasValue && project.Members.Any(m => m.EmployeeId == employeeId.Value);

        if (!isMember && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không phải thành viên dự án này.");
        }

        var attachment = await _context.ProjectAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.ProjectId == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("File đính kèm", request.AttachmentId);

        var subFolder = $"{SubFolderPrefix}/{request.ProjectId}";
        var (content, _, _) = await _fileStorageService.GetFileAsync(attachment.StoredFileName, subFolder, cancellationToken);

        return new ProjectAttachmentFileResult(content, attachment.ContentType, attachment.FileName);
    }
}
