using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Common;

public static class TaskDiscussionMapping
{
    public static TaskAttachmentDto ToDto(this TaskAttachment a) => new(
        a.Id,
        a.FileName,
        a.ContentType,
        a.FileSizeBytes,
        a.UploadedBy?.FullName ?? string.Empty,
        a.CreatedDate);

    public static TaskCommentDto ToDto(this TaskComment c) => new(
        c.Id,
        c.TaskId,
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
