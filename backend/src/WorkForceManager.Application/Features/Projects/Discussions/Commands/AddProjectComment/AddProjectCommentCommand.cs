using MediatR;
using Microsoft.AspNetCore.Http;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Projects.Discussions.Common;

namespace WorkForceManager.Application.Features.Projects.Discussions.Commands.AddProjectComment;

public record AddProjectCommentCommand(
    int ProjectId,
    string? Content,
    List<IFormFile>? Files) : IRequest<ApiResponse<ProjectCommentDto>>;
