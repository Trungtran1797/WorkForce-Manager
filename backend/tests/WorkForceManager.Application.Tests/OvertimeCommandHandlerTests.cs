using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Overtime.Commands.ApproveOvertime;
using WorkForceManager.Application.Features.Overtime.Commands.CreateOvertimeRequest;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class OvertimeCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();
    private readonly Mock<INotificationService> _notification = new();

    public OvertimeCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.Now).Returns(new DateTime(2026, 6, 13, 18, 0, 0));
    }

    [Fact]
    public async Task Create_ShouldComputeHoursFromTimeRange()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(1);
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        await _context.SaveChangesAsync();

        var handler = new CreateOvertimeRequestCommandHandler(_context, _currentUser.Object, _notification.Object);
        var result = await handler.Handle(new CreateOvertimeRequestCommand("2026-06-13", "18:00", "20:30", "Gấp", null, null), CancellationToken.None);

        result.Hours.Should().Be(2.5m);
        result.Status.Should().Be(OvertimeStatus.Pending.ToString());
    }

    [Fact]
    public async Task Approve_ShouldSetApprovedAndApplyOvertimeHoursToAttendance()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(99);
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        _context.OvertimeRequests.Add(new OvertimeRequest
        {
            Id = 10,
            EmployeeId = 1,
            Date = new DateTime(2026, 6, 13),
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(21, 0),
            Hours = 3m,
            Status = OvertimeStatus.Pending
        });
        await _context.SaveChangesAsync();

        var handler = new ApproveOvertimeCommandHandler(_context, _currentUser.Object, _dateTime.Object, _notification.Object);
        var result = await handler.Handle(new ApproveOvertimeCommand(10), CancellationToken.None);

        result.Status.Should().Be(OvertimeStatus.Approved.ToString());

        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == 1 && a.Date == new DateTime(2026, 6, 13));
        attendance.Should().NotBeNull();
        attendance!.OvertimeHours.Should().Be(3m);
    }

    [Fact]
    public async Task Approve_ShouldThrowConflict_WhenNotPending()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(99);
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        var overtime = new OvertimeRequest
        {
            EmployeeId = 1,
            Date = new DateTime(2026, 6, 13),
            Hours = 2m,
            Status = OvertimeStatus.Approved
        };
        _context.OvertimeRequests.Add(overtime);
        await _context.SaveChangesAsync();

        var handler = new ApproveOvertimeCommandHandler(_context, _currentUser.Object, _dateTime.Object, _notification.Object);
        Func<Task> act = () => handler.Handle(new ApproveOvertimeCommand(overtime.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
