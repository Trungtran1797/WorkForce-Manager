using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Projects.Discussions.Common;

public static class ProjectDiscussionMapping
{
    public static ProjectAttachmentDto ToDto(this ProjectAttachment a) => new(
        a.Id,
        a.FileName,
        a.ContentType,
        a.FileSizeBytes,
        a.UploadedBy?.FullName ?? string.Empty,
        a.CreatedDate);

    public static ProjectCommentDto ToDto(this ProjectComment c) => new(
        c.Id,
        c.ProjectId,
        c.Content,
        c.AuthorId,
        c.Author?.FullName ?? string.Empty,
        c.CreatedDate,
        c.Attachments
            .Where(a => !a.IsDeleted)
            .OrderBy(a => a.Id)
            .Select(a => a.ToDto())
            .ToList());
}
