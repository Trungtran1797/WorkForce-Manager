using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Tasks.Discussions.Common;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskComments;

public record GetTaskCommentsQuery(int TaskId, int PageNumber, int PageSize)
    : IRequest<ApiResponse<PaginatedList<TaskCommentDto>>>;
