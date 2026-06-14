using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;
using WorkForceManager.Application.Features.Employees.Commands.DeleteEmployee;
using WorkForceManager.Application.Features.Employees.Commands.UpdateEmployee;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployeeById;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployees;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/employees")]
public class EmployeesController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetEmployeesQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<EmployeeDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetEmployeeByIdQuery(id), ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.CanManageEmployees)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Thêm nhân viên thành công."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.CanManageEmployees)]
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
    [Authorize(Policy = AuthorizationPolicies.CanManageEmployees)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteEmployeeCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa nhân viên."));
    }
}
