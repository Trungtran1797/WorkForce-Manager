using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskAttachment;

public record DeleteTaskAttachmentCommand(int TaskId, int AttachmentId) : IRequest<ApiResponse<object>>;
