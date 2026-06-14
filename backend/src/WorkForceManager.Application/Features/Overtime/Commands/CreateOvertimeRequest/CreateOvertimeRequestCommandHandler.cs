using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Overtime.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Overtime.Commands.CreateOvertimeRequest;

public class CreateOvertimeRequestCommandHandler : IRequestHandler<CreateOvertimeRequestCommand, OvertimeRequestDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public CreateOvertimeRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<OvertimeRequestDto> Handle(CreateOvertimeRequestCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null or 0)
        {
            throw new ForbiddenAccessException("Người dùng không liên kết với thông tin nhân viên.");
        }

        var date = DateTime.Parse(request.Date).Date;
        var startTime = TimeOnly.Parse(request.StartTime);
        var endTime = TimeOnly.Parse(request.EndTime);

        if (endTime <= startTime)
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(request.EndTime), "Giờ kết thúc phải sau giờ bắt đầu.")
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", employeeId);

        var hours = (decimal)(endTime - startTime).TotalHours;

        var overtime = new OvertimeRequest
        {
            EmployeeId = employeeId.Value,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            Hours = Math.Round(hours, 2),
            Reason = request.Reason,
            Status = OvertimeStatus.Pending
        };

        _context.OvertimeRequests.Add(overtime);
        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.SendNotificationToRoleAsync(
            "Manager",
            "Đơn đăng ký làm thêm giờ mới",
            $"{employee.FullName} đăng ký làm thêm {overtime.Hours} giờ ngày {date:dd/MM/yyyy}.",
            "overtime",
            "/overtime",
            cancellationToken);

        overtime.Employee = employee;
        return overtime.ToDto();
    }
}
