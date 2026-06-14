using MediatR;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskAttachmentDownload;

public record GetTaskAttachmentDownloadQuery(int TaskId, int AttachmentId)
    : IRequest<TaskAttachmentFileResult>;

public record TaskAttachmentFileResult(Stream Content, string ContentType, string FileName);
