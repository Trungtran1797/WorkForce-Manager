using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskAttachment;

public class DeleteTaskAttachmentCommandHandler : IRequestHandler<DeleteTaskAttachmentCommand, ApiResponse<object>>
{
    private const string SubFolderPrefix = "tasks";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteTaskAttachmentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<object>> Handle(DeleteTaskAttachmentCommand request, CancellationToken cancellationToken)
    {
        var attachment = await _context.TaskAttachments
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.TaskId == request.TaskId, cancellationToken)
            ?? throw new NotFoundException("File đính kèm", request.AttachmentId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;

        if (attachment.UploadedById != employeeId && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không có quyền xóa file đính kèm này.");
        }

        var subFolder = $"{SubFolderPrefix}/{request.TaskId}";
        _fileStorageService.DeleteFile(attachment.StoredFileName, subFolder);

        _context.TaskAttachments.Remove(attachment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Đã xóa file đính kèm.");
    }
}
