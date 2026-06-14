using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.ApproveLeaveRequest;

public class ApproveLeaveRequestCommandHandler : IRequestHandler<ApproveLeaveRequestCommand, LeaveRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;
    private readonly INotificationService _notificationService;

    public ApproveLeaveRequestCommandHandler(
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

    public async Task<LeaveRequestDto> Handle(ApproveLeaveRequestCommand request, CancellationToken cancellationToken)
    {
        var leaveRequest = await _context.LeaveRequests
            .Include(lr => lr.Employee)
            .FirstOrDefaultAsync(lr => lr.Id == request.Id, cancellationToken);

        if (leaveRequest == null)
        {
            throw new NotFoundException("LeaveRequest", request.Id);
        }

        var userRole = _currentUserService.Role;
        var employeeId = _currentUserService.EmployeeId;
        var now = _dateTimeService.Now;
        var isManagerApproval = false;
        var isHrApproval = false;

        if (leaveRequest.Status == LeaveStatus.PendingManager)
        {
            // Cần quyền Manager hoặc SuperAdmin
            if (userRole != UserRole.Manager && userRole != UserRole.SuperAdmin)
            {
                throw new ForbiddenAccessException("Bạn không có quyền duyệt ở bước này (Cần quyền Trưởng phòng hoặc Admin).");
            }

            leaveRequest.Status = LeaveStatus.PendingHr;
            leaveRequest.ManagerApproverId = employeeId != 0 ? employeeId : null;
            leaveRequest.ManagerApprovedDate = now;
            isManagerApproval = true;
        }
        else if (leaveRequest.Status == LeaveStatus.PendingHr)
        {
            // Cần quyền SuperAdmin (HR)
            if (userRole != UserRole.SuperAdmin)
            {
                throw new ForbiddenAccessException("Bạn không có quyền duyệt ở bước này (Cần quyền Admin/HR).");
            }

            leaveRequest.Status = LeaveStatus.Completed;
            leaveRequest.HrApproverId = employeeId != 0 ? employeeId : null;
            leaveRequest.HrApprovedDate = now;
            isHrApproval = true;
        }
        else
        {
            throw new ConflictException($"Không thể duyệt đơn đang ở trạng thái '{leaveRequest.Status}'.");
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Gửi thông báo real-time
        var requesterUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == leaveRequest.EmployeeId, cancellationToken);

        if (requesterUser != null)
        {
            if (isManagerApproval)
            {
                // 1. Thông báo cho nhân viên: đơn đã được Trưởng phòng duyệt
                await _notificationService.SendNotificationToUserAsync(
                    requesterUser.Id,
                    "Duyệt nghỉ phép",
                    "Đơn xin nghỉ phép của bạn đã được Trưởng phòng duyệt và đang chờ HR duyệt.",
                    "leave",
                    "/leave",
                    cancellationToken);

                // 2. Thông báo cho HR (SuperAdmin): có đơn mới cần duyệt
                await _notificationService.SendNotificationToRoleAsync(
                    "SuperAdmin",
                    "Đơn xin nghỉ phép cần duyệt",
                    $"{leaveRequest.Employee?.FullName ?? "Nhân viên"} đã được Trưởng phòng duyệt đơn nghỉ phép, đang chờ bạn phê duyệt.",
                    "leave",
                    "/leave",
                    cancellationToken);
            }
            else if (isHrApproval)
            {
                // Thông báo cho nhân viên: đơn đã được duyệt hoàn tất
                await _notificationService.SendNotificationToUserAsync(
                    requesterUser.Id,
                    "Duyệt nghỉ phép thành công",
                    "Đơn xin nghỉ phép của bạn đã được HR phê duyệt hoàn tất.",
                    "leave",
                    "/leave",
                    cancellationToken);
            }
        }

        return leaveRequest.ToDto();
    }
}
