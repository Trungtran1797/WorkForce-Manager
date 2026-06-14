using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Payroll.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Payroll.Commands.ApprovePayslip;

public class ApprovePayslipCommandHandler : IRequestHandler<ApprovePayslipCommand, PayslipDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;
    private readonly INotificationService _notificationService;

    public ApprovePayslipCommandHandler(
        IApplicationDbContext context,
        IDateTimeService dateTimeService,
        INotificationService notificationService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
        _notificationService = notificationService;
    }

    public async Task<PayslipDto> Handle(ApprovePayslipCommand request, CancellationToken cancellationToken)
    {
        var payslip = await _context.Payslips
            .Include(p => p.Items)
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Phiếu lương", request.Id);

        if (payslip.Status != PayslipStatus.Draft)
        {
            throw new ConflictException($"Không thể duyệt phiếu lương đang ở trạng thái '{payslip.Status}'.");
        }

        payslip.Status = PayslipStatus.Approved;
        payslip.ApprovedDate = _dateTimeService.Now;

        await _context.SaveChangesAsync(cancellationToken);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == payslip.EmployeeId, cancellationToken);
        if (user != null)
        {
            await _notificationService.SendNotificationToUserAsync(
                user.Id,
                "Phiếu lương đã duyệt",
                $"Phiếu lương kỳ {payslip.Period} của bạn đã được duyệt.",
                "payroll",
                "/my-payslips",
                cancellationToken);
        }

        return payslip.ToDto();
    }
}
