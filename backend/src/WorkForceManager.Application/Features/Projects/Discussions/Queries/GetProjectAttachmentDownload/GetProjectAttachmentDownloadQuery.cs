using MediatR;

namespace WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectAttachmentDownload;

public record GetProjectAttachmentDownloadQuery(int ProjectId, int AttachmentId)
    : IRequest<ProjectAttachmentFileResult>;

public record ProjectAttachmentFileResult(Stream Content, string ContentType, string FileName);
