using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectComment;

public record DeleteProjectCommentCommand(int ProjectId, int CommentId) : IRequest<ApiResponse<object>>;
