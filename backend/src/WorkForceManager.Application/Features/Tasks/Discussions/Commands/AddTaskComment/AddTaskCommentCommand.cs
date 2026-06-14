using MediatR;
using Microsoft.AspNetCore.Http;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Tasks.Discussions.Common;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Commands.AddTaskComment;

public record AddTaskCommentCommand(
    int TaskId,
    string? Content,
    List<IFormFile>? Files) : IRequest<ApiResponse<TaskCommentDto>>;
