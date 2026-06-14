using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskComment;

public record DeleteTaskCommentCommand(int TaskId, int CommentId) : IRequest<ApiResponse<object>>;
