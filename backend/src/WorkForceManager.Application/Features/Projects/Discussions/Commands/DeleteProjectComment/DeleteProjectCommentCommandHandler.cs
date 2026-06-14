using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectComment;

public class DeleteProjectCommentCommandHandler : IRequestHandler<DeleteProjectCommentCommand, ApiResponse<object>>
{
    private const string SubFolderPrefix = "projects";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteProjectCommentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<object>> Handle(DeleteProjectCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _context.ProjectComments
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == request.CommentId && c.ProjectId == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Bình luận", request.CommentId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;

        if (comment.AuthorId != employeeId && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không có quyền xóa bình luận này.");
        }

        var subFolder = $"{SubFolderPrefix}/{request.ProjectId}";

        foreach (var attachment in comment.Attachments.Where(a => !a.IsDeleted))
        {
            _fileStorageService.DeleteFile(attachment.StoredFileName, subFolder);
            _context.ProjectAttachments.Remove(attachment);
        }

        _context.ProjectComments.Remove(comment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Đã xóa bình luận.");
    }
}
