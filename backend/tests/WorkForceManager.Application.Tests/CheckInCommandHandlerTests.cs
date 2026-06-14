using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Attendances.Commands.CheckIn;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class CheckInCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly Mock<IDateTimeService> _dateTimeServiceMock;

    public CheckInCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _dateTimeServiceMock = new Mock<IDateTimeService>();

        var auditInterceptor = new AuditableEntitySaveChangesInterceptor(
            _currentUserServiceMock.Object,
            _dateTimeServiceMock.Object
        );

        _context = new ApplicationDbContext(options, auditInterceptor);
    }

    [Fact]
    public async Task Handle_ShouldCheckInSuccessfully_WhenUserIsNotCheckedIn()
    {
        // Arrange
        var employeeId = 1;
        _currentUserServiceMock.Setup(x => x.EmployeeId).Returns(employeeId);
        _currentUserServiceMock.Setup(x => x.UserName).Returns("test_emp");

        // 8:15 AM (Before 8:30 AM cutoff) -> Should be AttendanceStatus.Full
        var testTime = new DateTime(2026, 6, 13, 8, 15, 0);
        _dateTimeServiceMock.Setup(x => x.Now).Returns(testTime);
        _dateTimeServiceMock.Setup(x => x.UtcNow).Returns(testTime.ToUniversalTime());

        _context.Employees.Add(new Employee
        {
            Id = employeeId,
            EmployeeCode = "EMP001",
            FullName = "Employee One"
        });
        await _context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(_context, _currentUserServiceMock.Object, _dateTimeServiceMock.Object);
        var command = new CheckInCommand("Checkin dung gio");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AttendanceStatus.Full.ToString());
        result.CheckInTime.Should().Be(testTime.ToString("HH:mm:ss"));

        var attendanceInDb = await _context.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId);
        attendanceInDb.Should().NotBeNull();
        attendanceInDb!.Status.Should().Be(AttendanceStatus.Full);
    }

    [Fact]
    public async Task Handle_ShouldSetLateStatus_WhenCheckInAfterCutoff()
    {
        // Arrange
        var employeeId = 2;
        _currentUserServiceMock.Setup(x => x.EmployeeId).Returns(employeeId);

        // 8:45 AM (After 8:30 AM cutoff) -> Should be AttendanceStatus.Late
        var testTime = new DateTime(2026, 6, 13, 8, 45, 0);
        _dateTimeServiceMock.Setup(x => x.Now).Returns(testTime);
        _dateTimeServiceMock.Setup(x => x.UtcNow).Returns(testTime.ToUniversalTime());

        _context.Employees.Add(new Employee
        {
            Id = employeeId,
            EmployeeCode = "EMP002",
            FullName = "Employee Two"
        });
        await _context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(_context, _currentUserServiceMock.Object, _dateTimeServiceMock.Object);
        var command = new CheckInCommand("Di muon");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(AttendanceStatus.Late.ToString());
    }

    [Fact]
    public async Task Handle_ShouldThrowConflictException_WhenAlreadyCheckedInToday()
    {
        // Arrange
        var employeeId = 3;
        _currentUserServiceMock.Setup(x => x.EmployeeId).Returns(employeeId);

        var testTime = new DateTime(2026, 6, 13, 8, 0, 0);
        _dateTimeServiceMock.Setup(x => x.Now).Returns(testTime);

        _context.Employees.Add(new Employee
        {
            Id = employeeId,
            EmployeeCode = "EMP003",
            FullName = "Employee Three"
        });
        _context.Attendances.Add(new Attendance
        {
            EmployeeId = employeeId,
            Date = testTime.Date,
            CheckInTime = testTime,
            Status = AttendanceStatus.Full
        });
        await _context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(_context, _currentUserServiceMock.Object, _dateTimeServiceMock.Object);
        var command = new CheckInCommand("Checkin lai");

        // Act
        Func<Task> act = () => handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }
}
