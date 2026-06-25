using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Projects.Discussions.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.AddProjectComment;

public class AddProjectCommentCommandHandler : IRequestHandler<AddProjectCommentCommand, ApiResponse<ProjectCommentDto>>
{
    private const string SubFolderPrefix = "projects";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public AddProjectCommentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<ProjectCommentDto>> Handle(AddProjectCommentCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var isMember = project.Members.Any(m => m.EmployeeId == employeeId.Value);
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;

        if (!isMember && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không phải thành viên dự án này.");
        }

        var comment = new ProjectComment
        {
            ProjectId = request.ProjectId,
            AuthorId = employeeId.Value,
            Content = request.Content?.Trim() ?? string.Empty
        };

        _context.ProjectComments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        if (request.Files is { Count: > 0 })
        {
            var subFolder = $"{SubFolderPrefix}/{project.Code}";

            foreach (var file in request.Files)
            {
                if (file.Length == 0)
                {
                    continue;
                }

                await using var stream = file.OpenReadStream();
                var (storedFileName, sizeBytes) = await _fileStorageService.SaveFileAsync(
                    stream, file.FileName, file.ContentType, subFolder, cancellationToken);

                _context.ProjectAttachments.Add(new ProjectAttachment
                {
                    ProjectId = request.ProjectId,
                    CommentId = comment.Id,
                    FileName = file.FileName,
                    StoredFileName = storedFileName,
                    ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                    FileSizeBytes = sizeBytes,
                    UploadedById = employeeId.Value
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        var created = await _context.ProjectComments
            .AsNoTracking()
            .Include(c => c.Author)
            .Include(c => c.Attachments)
            .ThenInclude(a => a.UploadedBy)
            .FirstAsync(c => c.Id == comment.Id, cancellationToken);

        return ApiResponse<ProjectCommentDto>.Ok(created.ToDto(), "Đã thêm bình luận.");
    }
}
