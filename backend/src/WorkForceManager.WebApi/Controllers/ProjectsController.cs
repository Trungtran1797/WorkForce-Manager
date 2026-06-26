using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Projects.Commands.AddProjectMember;
using WorkForceManager.Application.Features.Projects.Commands.CreateProject;
using WorkForceManager.Application.Features.Projects.Commands.DeleteProject;
using WorkForceManager.Application.Features.Projects.Commands.RemoveProjectMember;
using WorkForceManager.Application.Features.Projects.Commands.UpdateProject;
using WorkForceManager.Application.Features.Projects.Common;
using WorkForceManager.Application.Features.Projects.Discussions.Commands.AddProjectComment;
using WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectAttachment;
using WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectComment;
using WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectAttachmentDownload;
using WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectComments;
using WorkForceManager.Application.Features.Projects.Commands.CreateProjectFromTemplate;
using WorkForceManager.Application.Features.Projects.Commands.MarkProjectAsTemplate;
using WorkForceManager.Application.Features.Projects.Queries.GetProjectById;
using WorkForceManager.Application.Features.Projects.Queries.GetProjectTemplates;
using WorkForceManager.Application.Features.Projects.Queries.GetProjects;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/projects")]
public class ProjectsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] bool includeTemplates = false,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetProjectsQuery(search, status, includeTemplates), ct);
        return Ok(ApiResponse<List<ProjectDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProjectByIdQuery(id), ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result));
    }

    [HttpGet("templates")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetTemplates(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProjectTemplatesQuery(), ct);
        return Ok(ApiResponse<List<ProjectTemplateDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateProjectCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Tạo dự án thành công."));
    }

    [HttpPost("from-template")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> CreateFromTemplate([FromBody] CreateProjectFromTemplateCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Tạo dự án từ mẫu thành công."));
    }

    [HttpPatch("{id:int}/mark-template")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> MarkAsTemplate(int id, [FromBody] MarkAsTemplateRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new MarkProjectAsTemplateCommand(id, request.IsTemplate), ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result,
            request.IsTemplate ? "Đã lưu dự án làm mẫu." : "Đã bỏ đánh dấu mẫu."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectCommand command, CancellationToken ct)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<object>.Fail("Id không khớp."));
        }
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Cập nhật dự án thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteProjectCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa dự án."));
    }

    [HttpPost("{id:int}/members")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddProjectMemberRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddProjectMemberCommand(id, request.EmployeeId, request.Role), ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Đã thêm thành viên."));
    }

    [HttpDelete("{id:int}/members/{memberId:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> RemoveMember(int id, int memberId, CancellationToken ct)
    {
        var result = await Mediator.Send(new RemoveProjectMemberCommand(id, memberId), ct);
        return Ok(ApiResponse<ProjectDto>.Ok(result, "Đã xóa thành viên."));
    }

    [HttpGet("{id:int}/comments")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetComments(
        int id, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetProjectCommentsQuery(id, pageNumber, pageSize), ct);
        return Ok(result);
    }

    [HttpPost("{id:int}/comments")]
    [Consumes("multipart/form-data")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> AddComment(
        int id, [FromForm] string? content, [FromForm] List<IFormFile>? files, CancellationToken ct)
    {
        var result = await Mediator.Send(new AddProjectCommentCommand(id, content, files), ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/comments/{commentId:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> DeleteComment(int id, int commentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteProjectCommentCommand(id, commentId), ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/attachments/{attachmentId:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteProjectAttachmentCommand(id, attachmentId), ct);
        return Ok(result);
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}/download")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Projects) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProjectAttachmentDownloadQuery(id, attachmentId), ct);
        return File(result.Content, result.ContentType, result.FileName);
    }
}

public record AddProjectMemberRequest(int EmployeeId, string Role);
public record MarkAsTemplateRequest(bool IsTemplate);
