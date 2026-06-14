using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Overtime.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Overtime.Commands.RejectOvertime;

public class RejectOvertimeCommandHandler : IRequestHandler<RejectOvertimeCommand, OvertimeRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;
    private readonly INotificationService _notificationService;

    public RejectOvertimeCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
        _notificationService = notificationService;
    }

    public async Task<OvertimeRequestDto> Handle(RejectOvertimeCommand request, CancellationToken cancellationToken)
    {
        var overtime = await _context.OvertimeRequests
            .Include(o => o.Employee)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Đơn làm thêm giờ", request.Id);

        if (overtime.Status != OvertimeStatus.Pending)
        {
            throw new ConflictException($"Không thể từ chối đơn đang ở trạng thái '{overtime.Status}'.");
        }

        var approverEmployeeId = _currentUserService.EmployeeId;
        overtime.Status = OvertimeStatus.Rejected;
        overtime.ApproverId = approverEmployeeId is > 0 ? approverEmployeeId : null;
        overtime.ApprovedDate = _dateTimeService.Now;
        overtime.RejectReason = request.RejectReason;

        await _context.SaveChangesAsync(cancellationToken);

        var requesterUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == overtime.EmployeeId, cancellationToken);

        if (requesterUser != null)
        {
            await _notificationService.SendNotificationToUserAsync(
                requesterUser.Id,
                "Từ chối làm thêm giờ",
                $"Đơn làm thêm giờ ngày {overtime.Date:dd/MM/yyyy} của bạn đã bị từ chối.",
                "overtime",
                "/overtime",
                cancellationToken);
        }

        return overtime.ToDto();
    }
}
