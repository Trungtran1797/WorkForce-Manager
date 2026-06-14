using System.Globalization;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Payroll.Commands.SendPayslipEmail;

public class SendPayslipEmailCommandHandler : IRequestHandler<SendPayslipEmailCommand, Unit>
{
    private static readonly CultureInfo Vi = CultureInfo.GetCultureInfo("vi-VN");

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public SendPayslipEmailCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Unit> Handle(SendPayslipEmailCommand request, CancellationToken cancellationToken)
    {
        var payslip = await _context.Payslips
            .Include(p => p.Items)
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Phiếu lương", request.Id);

        var email = payslip.Employee?.Email;
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ConflictException("Nhân viên chưa có email để gửi phiếu lương.");
        }

        var html = BuildHtml(payslip);
        await _emailService.SendAsync(email, $"Phiếu lương kỳ {payslip.Period}", html, cancellationToken);

        return Unit.Value;
    }

    private static string BuildHtml(Domain.Entities.Payslip p)
    {
        var sb = new StringBuilder();
        sb.Append($"<h2>Phiếu lương kỳ {p.Period}</h2>");
        sb.Append($"<p>Nhân viên: <strong>{p.Employee?.FullName}</strong></p>");
        sb.Append($"<p>Ngày công: {p.WorkingDays}/{p.StandardWorkingDays} — OT: {p.OvertimeHours} giờ</p>");
        sb.Append("<table border='1' cellpadding='6' cellspacing='0'>");
        sb.Append("<tr><th>Khoản mục</th><th>Số tiền</th></tr>");
        foreach (var item in p.Items)
        {
            var sign = item.IsEarning ? "+" : "-";
            sb.Append($"<tr><td>{item.Label}</td><td style='text-align:right'>{sign} {item.Amount.ToString("N0", Vi)} đ</td></tr>");
        }
        sb.Append($"<tr><td><strong>Thực lĩnh</strong></td><td style='text-align:right'><strong>{p.NetSalary.ToString("N0", Vi)} đ</strong></td></tr>");
        sb.Append("</table>");
        return sb.ToString();
    }
}
