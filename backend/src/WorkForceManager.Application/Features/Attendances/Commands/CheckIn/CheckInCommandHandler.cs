using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Helpers;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Attendances.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Attendances.Commands.CheckIn;

public class CheckInCommandHandler : IRequestHandler<CheckInCommand, AttendanceDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public CheckInCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    public async Task<AttendanceDto> Handle(CheckInCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var now = _dateTimeService.Now;
        var todayDate = now.Date;

        // Có thể đã tồn tại bản chấm công của ngày (vd. tạo sẵn khi duyệt OT) nhưng chưa check-in.
        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == todayDate, cancellationToken);

        if (existing?.CheckInTime != null)
        {
            throw new ConflictException("Bạn đã check in hôm nay rồi.");
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException("Employee", employeeId);
        }

        // Cutoff ở 08:30 AM
        var cutoff = todayDate.AddHours(8).AddMinutes(30);
        var status = now <= cutoff ? AttendanceStatus.Full : AttendanceStatus.Late;

        // Ràng buộc vị trí: kiểm tra IP văn phòng hoặc GPS công trường theo các địa điểm đã cấu hình.
        var ipAddress = _currentUserService.IpAddress;
        var locations = await _context.OfficeLocations
            .AsNoTracking()
            .Where(l => l.IsActive)
            .ToListAsync(cancellationToken);
        var locationValid = LocationValidator.IsCheckInAllowed(locations, ipAddress, request.Latitude, request.Longitude);

        // Gán ca làm việc của ngày (nếu có phân ca).
        var shiftId = await _context.ShiftAssignments
            .Where(sa => sa.EmployeeId == employeeId && sa.WorkDate == todayDate)
            .Select(sa => (int?)sa.ShiftId)
            .FirstOrDefaultAsync(cancellationToken);

        var attendance = existing ?? new Attendance
        {
            EmployeeId = employeeId.Value,
            Date = todayDate
        };

        attendance.CheckInTime = now;
        attendance.CheckOutTime = null;
        attendance.Status = status;
        attendance.WorkingHours = null;
        attendance.Note = request.Note;
        attendance.ShiftId = shiftId;
        attendance.CheckInIp = ipAddress;
        attendance.CheckInLatitude = request.Latitude;
        attendance.CheckInLongitude = request.Longitude;
        attendance.LocationValid = locationValid;

        if (existing == null)
        {
            _context.Attendances.Add(attendance);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Nạp lại với Navigation Property Employee
        attendance.Employee = employee;

        return attendance.ToDto();
    }
}
