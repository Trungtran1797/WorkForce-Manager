using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Tasks.Discussions.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.AddTaskComment;

public class AddTaskCommentCommandHandler : IRequestHandler<AddTaskCommentCommand, ApiResponse<TaskCommentDto>>
{
    private const string SubFolderPrefix = "tasks";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public AddTaskCommentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<TaskCommentDto>> Handle(AddTaskCommentCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .ThenInclude(p => p!.Members)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("Công việc", request.TaskId);

        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        if (!TaskDiscussionAccess.CanAccess(task, employeeId, _currentUserService.Role))
        {
            throw new ForbiddenAccessException("Bạn không có quyền thảo luận trên công việc này.");
        }

        var comment = new TaskComment
        {
            TaskId = request.TaskId,
            AuthorId = employeeId.Value,
            Content = request.Content?.Trim() ?? string.Empty
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        if (request.Files is { Count: > 0 })
        {
            var subFolder = $"{SubFolderPrefix}/{request.TaskId}";

            foreach (var file in request.Files)
            {
                if (file.Length == 0)
                {
                    continue;
                }

                await using var stream = file.OpenReadStream();
                var (storedFileName, sizeBytes) = await _fileStorageService.SaveFileAsync(
                    stream, file.FileName, file.ContentType, subFolder, cancellationToken);

                _context.TaskAttachments.Add(new TaskAttachment
                {
                    TaskId = request.TaskId,
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

        var created = await _context.TaskComments
            .AsNoTracking()
            .Include(c => c.Author)
            .Include(c => c.Attachments)
            .ThenInclude(a => a.UploadedBy)
            .FirstAsync(c => c.Id == comment.Id, cancellationToken);

        return ApiResponse<TaskCommentDto>.Ok(created.ToDto(), "Đã thêm bình luận.");
    }
}
