using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;
using WorkForceManager.Application.Features.Employees.Commands.DeleteEmployee;
using WorkForceManager.Application.Features.Employees.Commands.UpdateEmployee;
using WorkForceManager.Application.Features.Employees.Commands.ImportEmployees;
using WorkForceManager.Application.Features.Employees.Commands.UpdateMyProfile;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployeeById;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployees;
using WorkForceManager.Application.Features.Employees.Queries.ExportEmployees;
using WorkForceManager.Application.Features.Employees.Queries.GetMyProfile;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/employees")]
public class EmployeesController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] GetEmployeesQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<EmployeeDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetEmployeeByIdQuery(id), ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Thêm nhân viên thành công."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeCommand command, CancellationToken ct)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<object>.Fail("Id không khớp."));
        }
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật nhân viên thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteEmployeeCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa nhân viên."));
    }

    [HttpGet("export")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> Export([FromQuery] bool templateOnly, CancellationToken ct)
    {
        var result = await Mediator.Send(new ExportEmployeesQuery(templateOnly), ct);
        return File(result.FileContents, result.ContentType, result.FileName);
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Import([FromForm] IFormFile file, CancellationToken ct)
    {
        var result = await Mediator.Send(new ImportEmployeesCommand(file), ct);
        return Ok(ApiResponse<ImportEmployeesResultDto>.Ok(result, "Xử lý import thành công."));
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyProfileQuery(), ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMyProfileCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật hồ sơ cá nhân thành công."));
    }
}
