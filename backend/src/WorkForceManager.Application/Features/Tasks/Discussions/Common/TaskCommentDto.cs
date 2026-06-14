namespace WorkForceManager.Application.Features.Tasks.Discussions.Common;

public record TaskAttachmentDto(
    int Id,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string UploadedByName,
    DateTime CreatedDate);

public record TaskCommentDto(
    int Id,
    int TaskId,
    string Content,
    int AuthorId,
    string AuthorName,
    DateTime CreatedDate,
    List<TaskAttachmentDto> Attachments);
