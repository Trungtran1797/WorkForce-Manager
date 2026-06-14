using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Payroll.Commands.ApprovePayslip;
using WorkForceManager.Application.Features.Payroll.Commands.GeneratePayroll;
using WorkForceManager.Application.Features.Payroll.Commands.SendPayslipEmail;
using WorkForceManager.Application.Features.Payroll.Common;
using WorkForceManager.Application.Features.Payroll.Queries.GetMyPayslips;
using WorkForceManager.Application.Features.Payroll.Queries.GetPayslips;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/payroll")]
public class PayrollController : ApiControllerBase
{
    [HttpGet("my")]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyPayslipsQuery(), ct);
        return Ok(ApiResponse<List<PayslipDto>>.Ok(result));
    }

    [HttpGet("payslips")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
    public async Task<IActionResult> GetPayslips([FromQuery] GetPayslipsQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<PayslipDto>>.Ok(result));
    }

    [HttpPost("generate")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
    public async Task<IActionResult> Generate([FromBody] GeneratePayrollCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<List<PayslipDto>>.Ok(result, "Tính lương thành công."));
    }

    [HttpPost("payslips/{id:int}/approve")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new ApprovePayslipCommand(id), ct);
        return Ok(ApiResponse<PayslipDto>.Ok(result, "Duyệt phiếu lương thành công."));
    }

    [HttpPost("payslips/{id:int}/send-email")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePayroll)]
    public async Task<IActionResult> SendEmail(int id, CancellationToken ct)
    {
        await Mediator.Send(new SendPayslipEmailCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã gửi phiếu lương qua email."));
    }
}
