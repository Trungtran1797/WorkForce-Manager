using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.RejectLeaveRequest;

public class RejectLeaveRequestCommandHandler : IRequestHandler<RejectLeaveRequestCommand, LeaveRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public RejectLeaveRequestCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<LeaveRequestDto> Handle(RejectLeaveRequestCommand request, CancellationToken cancellationToken)
    {
        var leaveRequest = await _context.LeaveRequests
            .Include(lr => lr.Employee)
            .FirstOrDefaultAsync(lr => lr.Id == request.Id, cancellationToken);

        if (leaveRequest == null)
        {
            throw new NotFoundException("LeaveRequest", request.Id);
        }

        var userRole = _currentUserService.Role;
        if (userRole != UserRole.Manager && userRole != UserRole.SuperAdmin)
        {
            throw new ForbiddenAccessException("Bạn không có quyền từ chối đơn nghỉ phép.");
        }

        if (leaveRequest.Status == LeaveStatus.Completed || leaveRequest.Status == LeaveStatus.Rejected)
        {
            throw new ConflictException($"Không thể từ chối đơn nghỉ phép đã kết thúc hoặc đã bị từ chối.");
        }

        var employeeId = _currentUserService.EmployeeId;
        var approverId = employeeId != 0 ? employeeId : null;

        if (leaveRequest.Status == LeaveStatus.PendingManager)
        {
            leaveRequest.ManagerApproverId = approverId;
            leaveRequest.ManagerApprovedDate = DateTime.Now;
        }
        else if (leaveRequest.Status == LeaveStatus.PendingHr)
        {
            leaveRequest.HrApproverId = approverId;
            leaveRequest.HrApprovedDate = DateTime.Now;
        }

        leaveRequest.Status = LeaveStatus.Rejected;
        leaveRequest.RejectReason = request.Reason;

        await _context.SaveChangesAsync(cancellationToken);

        // Gửi thông báo cho nhân viên
        var requesterUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == leaveRequest.EmployeeId, cancellationToken);
        if (requesterUser != null)
        {
            await _notificationService.SendNotificationToUserAsync(
                requesterUser.Id,
                "Từ chối nghỉ phép",
                $"Đơn xin nghỉ phép của bạn đã bị từ chối. Lý do: \"{request.Reason}\"",
                "leave",
                "/leave",
                cancellationToken);
        }

        return leaveRequest.ToDto();
    }
}
