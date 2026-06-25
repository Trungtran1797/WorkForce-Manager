using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.SalaryConfigs.Commands.SaveSalaryConfig;
using WorkForceManager.Application.Features.SalaryConfigs.Common;
using WorkForceManager.Application.Features.SalaryConfigs.Queries.GetSalaryConfigs;
using WorkForceManager.Application.Features.TaxBrackets.GetTaxBrackets;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/salary-configs")]
public class SalaryConfigsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.SalaryConfigs) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSalaryConfigsQuery(), ct);
        return Ok(ApiResponse<List<SalaryConfigDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.SalaryConfigs) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Save([FromBody] SaveSalaryConfigCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<SalaryConfigDto>.Ok(result, "Lưu cấu hình lương thành công."));
    }

    [HttpGet("/api/v1/tax-brackets")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.SalaryConfigs) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetTaxBrackets(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTaxBracketsQuery(), ct);
        return Ok(ApiResponse<List<TaxBracketDto>>.Ok(result));
    }
}
