using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.LeaveRequests.Commands.CreateLeaveRequest;

public class CreateLeaveRequestCommandHandler : IRequestHandler<CreateLeaveRequestCommand, LeaveRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public CreateLeaveRequestCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<LeaveRequestDto> Handle(CreateLeaveRequestCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null || employeeId == 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var failures = new List<ValidationFailure>();

        if (!DateTime.TryParse(request.StartDate, out var startDate))
        {
            failures.Add(new ValidationFailure("StartDate", "Định dạng ngày bắt đầu không hợp lệ."));
        }

        if (!DateTime.TryParse(request.EndDate, out var endDate))
        {
            failures.Add(new ValidationFailure("EndDate", "Định dạng ngày kết thúc không hợp lệ."));
        }

        if (!Enum.TryParse<LeaveType>(request.LeaveType, out var type))
        {
            failures.Add(new ValidationFailure("LeaveType", $"Loại nghỉ '{request.LeaveType}' không hợp lệ."));
        }

        if (failures.Count > 0)
        {
            throw new ValidationException(failures);
        }

        if (endDate.Date < startDate.Date)
        {
            failures.Add(new ValidationFailure("EndDate", "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu."));
            throw new ValidationException(failures);
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);

        if (employee == null)
        {
            throw new NotFoundException("Employee", employeeId);
        }

        var totalDays = (int)(endDate.Date - startDate.Date).TotalDays + 1;

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = employeeId.Value,
            Type = type,
            StartDate = startDate.Date,
            EndDate = endDate.Date,
            TotalDays = totalDays,
            Reason = request.Reason,
            Status = LeaveStatus.PendingManager
        };

        _context.LeaveRequests.Add(leaveRequest);
        await _context.SaveChangesAsync(cancellationToken);

        // Gửi thông báo đến toàn bộ Quản lý
        await _notificationService.SendNotificationToRoleAsync(
            "Manager",
            "Đơn xin nghỉ phép mới",
            $"{employee.FullName} đã gửi đơn xin nghỉ phép từ ngày {startDate:dd/MM/yyyy} đến {endDate:dd/MM/yyyy}.",
            "leave",
            "/leave",
            cancellationToken);

        // Nạp Employee vào model
        leaveRequest.Employee = employee;

        return leaveRequest.ToDto();
    }
}
