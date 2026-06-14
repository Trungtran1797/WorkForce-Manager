using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Projects.Discussions.Common;

namespace WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectComments;

public record GetProjectCommentsQuery(int ProjectId, int PageNumber, int PageSize)
    : IRequest<ApiResponse<PaginatedList<ProjectCommentDto>>>;
