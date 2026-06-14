using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Attendances.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Attendances.Commands.CheckOut;

public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, AttendanceDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public CheckOutCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    public async Task<AttendanceDto> Handle(CheckOutCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var now = _dateTimeService.Now;
        var todayDate = now.Date;

        var attendance = await _context.Attendances
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == todayDate, cancellationToken);

        if (attendance == null)
        {
            throw new NotFoundException("Bạn chưa check in hôm nay. Vui lòng check in trước khi check out.");
        }

        if (attendance.CheckOutTime != null)
        {
            throw new ConflictException("Bạn đã check out hôm nay rồi.");
        }

        attendance.CheckOutTime = now;
        attendance.WorkingHours = (decimal)(now - attendance.CheckInTime!.Value).TotalHours;

        if (request.Note != null)
        {
            attendance.Note = string.IsNullOrWhiteSpace(attendance.Note)
                ? request.Note
                : $"{attendance.Note} | {request.Note}";
        }

        // Nếu về sớm (trước 17:00) và check-in đúng giờ, chuyển trạng thái thành EarlyLeave
        var standardCheckOut = todayDate.AddHours(17);
        if (now < standardCheckOut && attendance.Status == AttendanceStatus.Full)
        {
            attendance.Status = AttendanceStatus.EarlyLeave;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return attendance.ToDto();
    }
}
