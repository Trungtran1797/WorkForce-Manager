using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Departments.Commands.CreateDepartment;
using WorkForceManager.Application.Features.Departments.Commands.DeleteDepartment;
using WorkForceManager.Application.Features.Departments.Commands.UpdateDepartment;
using WorkForceManager.Application.Features.Departments.Common;
using WorkForceManager.Application.Features.Departments.Queries.GetDepartments;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/departments")]
public class DepartmentsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Departments) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] string? search, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDepartmentsQuery(search), ct);
        return Ok(ApiResponse<List<DepartmentDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Departments) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<DepartmentDto>.Ok(result, "Tạo phòng ban thành công."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Departments) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentCommand command, CancellationToken ct)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<object>.Fail("Id không khớp."));
        }
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<DepartmentDto>.Ok(result, "Cập nhật phòng ban thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Departments) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteDepartmentCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa phòng ban."));
    }
}
