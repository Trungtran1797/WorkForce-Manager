using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectAttachment;

public record DeleteProjectAttachmentCommand(int ProjectId, int AttachmentId) : IRequest<ApiResponse<object>>;
