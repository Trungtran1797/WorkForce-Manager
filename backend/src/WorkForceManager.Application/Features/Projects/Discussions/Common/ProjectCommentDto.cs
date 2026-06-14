namespace WorkForceManager.Application.Features.Projects.Discussions.Common;

public record ProjectAttachmentDto(
    int Id,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string UploadedByName,
    DateTime CreatedDate);

public record ProjectCommentDto(
    int Id,
    int ProjectId,
    string Content,
    int AuthorId,
    string AuthorName,
    DateTime CreatedDate,
    List<ProjectAttachmentDto> Attachments);
