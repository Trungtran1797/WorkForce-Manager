using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Overtime.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Overtime.Commands.ApproveOvertime;

public class ApproveOvertimeCommandHandler : IRequestHandler<ApproveOvertimeCommand, OvertimeRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;
    private readonly INotificationService _notificationService;

    public ApproveOvertimeCommandHandler(
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

    public async Task<OvertimeRequestDto> Handle(ApproveOvertimeCommand request, CancellationToken cancellationToken)
    {
        var overtime = await _context.OvertimeRequests
            .Include(o => o.Employee)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Đơn làm thêm giờ", request.Id);

        if (overtime.Status != OvertimeStatus.Pending)
        {
            throw new ConflictException($"Không thể duyệt đơn đang ở trạng thái '{overtime.Status}'.");
        }

        var approverEmployeeId = _currentUserService.EmployeeId;
        overtime.Status = OvertimeStatus.Approved;
        overtime.ApproverId = approverEmployeeId is > 0 ? approverEmployeeId : null;
        overtime.ApprovedDate = _dateTimeService.Now;

        // Áp giờ OT đã duyệt vào bản chấm công cùng ngày (tạo mới nếu chưa có) để tổng hợp lương.
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == overtime.EmployeeId && a.Date == overtime.Date, cancellationToken);

        if (attendance == null)
        {
            attendance = new Attendance
            {
                EmployeeId = overtime.EmployeeId,
                Date = overtime.Date,
                Status = AttendanceStatus.Absent,
                OvertimeHours = overtime.Hours
            };
            _context.Attendances.Add(attendance);
        }
        else
        {
            attendance.OvertimeHours = (attendance.OvertimeHours ?? 0) + overtime.Hours;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var requesterUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == overtime.EmployeeId, cancellationToken);

        if (requesterUser != null)
        {
            await _notificationService.SendNotificationToUserAsync(
                requesterUser.Id,
                "Duyệt làm thêm giờ",
                $"Đơn làm thêm {overtime.Hours} giờ ngày {overtime.Date:dd/MM/yyyy} của bạn đã được duyệt.",
                "overtime",
                "/overtime",
                cancellationToken);
        }

        return overtime.ToDto();
    }
}
