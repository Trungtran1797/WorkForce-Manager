using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Contracts.Commands.DeleteContract;
using WorkForceManager.Application.Features.Contracts.Commands.SaveContract;
using WorkForceManager.Application.Features.Contracts.Common;
using WorkForceManager.Application.Features.Contracts.Queries.GetContracts;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
[Route("api/v1/contracts")]
public class ContractsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetContractsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<ContractDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveContractCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<ContractDto>.Ok(result, "Lưu hợp đồng thành công."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteContractCommand(id), ct);
        return Ok(ApiResponse.Ok("Xóa hợp đồng thành công."));
    }
}
