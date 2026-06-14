using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.SalaryConfigs.Commands.SaveSalaryConfig;
using WorkForceManager.Application.Features.SalaryConfigs.Common;
using WorkForceManager.Application.Features.SalaryConfigs.Queries.GetSalaryConfigs;
using WorkForceManager.Application.Features.TaxBrackets.GetTaxBrackets;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
[Route("api/v1/salary-configs")]
public class SalaryConfigsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetSalaryConfigsQuery(), ct);
        return Ok(ApiResponse<List<SalaryConfigDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveSalaryConfigCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<SalaryConfigDto>.Ok(result, "Lưu cấu hình lương thành công."));
    }

    [HttpGet("/api/v1/tax-brackets")]
    public async Task<IActionResult> GetTaxBrackets(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetTaxBracketsQuery(), ct);
        return Ok(ApiResponse<List<TaxBracketDto>>.Ok(result));
    }
}
