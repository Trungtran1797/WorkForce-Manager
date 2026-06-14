using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Discussions.Common;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskAttachmentDownload;

public class GetTaskAttachmentDownloadQueryHandler
    : IRequestHandler<GetTaskAttachmentDownloadQuery, TaskAttachmentFileResult>
{
    private const string SubFolderPrefix = "tasks";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public GetTaskAttachmentDownloadQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<TaskAttachmentFileResult> Handle(GetTaskAttachmentDownloadQuery request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
            .ThenInclude(p => p!.Members)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.TaskId);

        var employeeId = _currentUserService.EmployeeId;

        if (!TaskDiscussionAccess.CanAccess(task, employeeId, _currentUserService.Role))
        {
            throw new ForbiddenAccessException("Bạn không có quyền tải file đính kèm của công việc này.");
        }

        var attachment = await _context.TaskAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.TaskId == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("File đính kèm", request.AttachmentId);

        var subFolder = $"{SubFolderPrefix}/{request.TaskId}";
        var (content, _, _) = await _fileStorageService.GetFileAsync(attachment.StoredFileName, subFolder, cancellationToken);

        return new TaskAttachmentFileResult(content, attachment.ContentType, attachment.FileName);
    }
}
