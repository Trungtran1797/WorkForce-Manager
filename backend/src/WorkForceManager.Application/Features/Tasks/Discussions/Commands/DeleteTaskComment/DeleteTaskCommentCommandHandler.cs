using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskComment;

public class DeleteTaskCommentCommandHandler : IRequestHandler<DeleteTaskCommentCommand, ApiResponse<object>>
{
    private const string SubFolderPrefix = "tasks";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteTaskCommentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<object>> Handle(DeleteTaskCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _context.TaskComments
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == request.CommentId && c.TaskId == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("Bình luận", request.CommentId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;

        if (comment.AuthorId != employeeId && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không có quyền xóa bình luận này.");
        }

        var subFolder = $"{SubFolderPrefix}/{request.TaskId}";

        foreach (var attachment in comment.Attachments.Where(a => !a.IsDeleted))
        {
            _fileStorageService.DeleteFile(attachment.StoredFileName, subFolder);
            _context.TaskAttachments.Remove(attachment);
        }

        _context.TaskComments.Remove(comment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Đã xóa bình luận.");
    }
}
