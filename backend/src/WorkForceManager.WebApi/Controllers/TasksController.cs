using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Tasks.Commands.CreateTask;
using WorkForceManager.Application.Features.Tasks.Commands.DeleteTask;
using WorkForceManager.Application.Features.Tasks.Commands.UpdateTask;
using WorkForceManager.Application.Features.Tasks.Commands.UpdateTaskStatus;
using WorkForceManager.Application.Features.Tasks.Common;
using WorkForceManager.Application.Features.Tasks.Discussions.Commands.AddTaskComment;
using WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskAttachment;
using WorkForceManager.Application.Features.Tasks.Discussions.Commands.DeleteTaskComment;
using WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskAttachmentDownload;
using WorkForceManager.Application.Features.Tasks.Discussions.Queries.GetTaskComments;
using WorkForceManager.Application.Features.Tasks.Queries.GetTaskById;
using WorkForceManager.Application.Features.Tasks.Queries.GetTasks;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/tasks")]
public class TasksController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? projectId,
        [FromQuery] int? assigneeId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int? parentTaskId,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTasksQuery(projectId, assigneeId, status, search, parentTaskId), ct);
        return Ok(ApiResponse<List<TaskDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTaskByIdQuery(id), ct);
        return Ok(ApiResponse<TaskDto>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Tạo công việc thành công."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskCommand command, CancellationToken ct)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<object>.Fail("Id không khớp."));
        }
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Cập nhật công việc thành công."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTaskStatusRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateTaskStatusCommand(id, request.Status, request.Progress), ct);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Đã cập nhật trạng thái."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteTaskCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa công việc."));
    }

    [HttpGet("{id:int}/comments")]
    public async Task<IActionResult> GetComments(
        int id, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetTaskCommentsQuery(id, pageNumber, pageSize), ct);
        return Ok(result);
    }

    [HttpPost("{id:int}/comments")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> AddComment(
        int id, [FromForm] string? content, [FromForm] List<IFormFile>? files, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddTaskCommentCommand(id, content, files), ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/comments/{commentId:int}")]
    public async Task<IActionResult> DeleteComment(int id, int commentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteTaskCommentCommand(id, commentId), ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteTaskAttachmentCommand(id, attachmentId), ct);
        return Ok(result);
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}/download")]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTaskAttachmentDownloadQuery(id, attachmentId), ct);
        return File(result.Content, result.ContentType, result.FileName);
    }
}

public record UpdateTaskStatusRequest(string Status, int? Progress);
