using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Projects.Commands.UploadProjectAttachments;

public class UploadProjectAttachmentsCommandHandler : IRequestHandler<UploadProjectAttachmentsCommand, ApiResponse<object>>
{
    private const string SubFolderPrefix = "projects";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    public UploadProjectAttachmentsCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<object>> Handle(UploadProjectAttachmentsCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException("Dự án", request.ProjectId);

        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        if (request.Files is { Count: > 0 })
        {
            var subFolder = $"{SubFolderPrefix}/{project.Code}";

            foreach (var file in request.Files)
            {
                if (file.Length == 0) continue;

                await using var stream = file.OpenReadStream();
                var (storedFileName, sizeBytes) = await _fileStorageService.SaveFileAsync(
                    stream, file.FileName, file.ContentType, subFolder, cancellationToken);

                _context.ProjectAttachments.Add(new ProjectAttachment
                {
                    ProjectId = request.ProjectId,
                    CommentId = null,
                    FileName = file.FileName,
                    StoredFileName = storedFileName,
                    ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                    FileSizeBytes = sizeBytes,
                    UploadedById = employeeId.Value
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<object>.Ok(null, "Đã tải lên tài liệu đính kèm.");
    }
}
