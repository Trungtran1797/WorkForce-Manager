using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectAttachment;

public class DeleteProjectAttachmentCommandHandler : IRequestHandler<DeleteProjectAttachmentCommand, ApiResponse<object>>
{
    private const string SubFolderPrefix = "projects";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public DeleteProjectAttachmentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<object>> Handle(DeleteProjectAttachmentCommand request, CancellationToken cancellationToken)
    {
        var attachment = await _context.ProjectAttachments
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.ProjectId == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("File đính kèm", request.AttachmentId);

        var employeeId = _currentUserService.EmployeeId;
        var canManage = _currentUserService.Role is UserRole.SuperAdmin or UserRole.Manager;

        if (attachment.UploadedById != employeeId && !canManage)
        {
            throw new ForbiddenAccessException("Bạn không có quyền xóa file đính kèm này.");
        }

        var projectCode = await _context.Projects
            .AsNoTracking()
            .Where(p => p.Id == request.ProjectId)
            .Select(p => p.Code)
            .FirstOrDefaultAsync(cancellationToken) ?? request.ProjectId.ToString();

        var subFolder = $"{SubFolderPrefix}/{projectCode}";
        _fileStorageService.DeleteFile(attachment.StoredFileName, subFolder);

        _context.ProjectAttachments.Remove(attachment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Đã xóa file đính kèm.");
    }
}
