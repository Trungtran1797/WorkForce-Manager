using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Commands.CreateTask;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class CreateTaskCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<INotificationService> _notificationServiceMock;

    public CreateTaskCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(x => x.UserName).Returns("test_user");

        var dateTimeServiceMock = new Mock<IDateTimeService>();
        dateTimeServiceMock.Setup(x => x.Now).Returns(DateTime.Now);
        dateTimeServiceMock.Setup(x => x.UtcNow).Returns(DateTime.UtcNow);

        var auditInterceptor = new AuditableEntitySaveChangesInterceptor(
            currentUserServiceMock.Object,
            dateTimeServiceMock.Object
        );

        _context = new ApplicationDbContext(options, auditInterceptor);
        _notificationServiceMock = new Mock<INotificationService>();
    }

    [Fact]
    public async Task Handle_ShouldCreateTask_WhenRequestIsValid()
    {
        // Arrange
        var command = new CreateTaskCommand(
            Code: "TASK-001",
            Title: "Test Task",
            Description: "Task Description",
            AssigneeId: 1,
            AssignerId: 2,
            Priority: "High",
            Status: "Todo",
            StartDate: "2026-06-13",
            DueDate: "2026-06-20",
            Progress: 0,
            ProjectId: null,
            ParentTaskId: null
        );

        // Thêm nhân viên ảo vào DB để mapper và logic check không bị lỗi
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "EMP001", FullName = "Assignee Employee" });
        _context.Employees.Add(new Employee { Id = 2, EmployeeCode = "EMP002", FullName = "Assigner Employee" });
        _context.Users.Add(new User { Id = 10, EmployeeId = 1, Username = "assignee_user" });
        await _context.SaveChangesAsync();

        var handler = new CreateTaskCommandHandler(_context, _notificationServiceMock.Object);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        var expectedCode = $"{DateTime.Now:yy}-TAS-001";
        result.Should().NotBeNull();
        result.Code.Should().Be(expectedCode);
        result.Title.Should().Be("Test Task");

        var taskInDb = await _context.Tasks.FirstOrDefaultAsync(t => t.Code == expectedCode);
        taskInDb.Should().NotBeNull();
        taskInDb!.Title.Should().Be("Test Task");
        taskInDb.Priority.Should().Be(TaskPriority.High);
    }

    [Fact]
    public async Task Handle_ShouldGenerateIncrementalTaskCode_WhenTaskCodeAlreadyExists()
    {
        // Arrange
        var yearSuffix = DateTime.Now.ToString("yy");
        var existingCode = $"{yearSuffix}-TAS-001";
        _context.Tasks.Add(new TaskItem
        {
            Code = existingCode,
            Title = "Existing Task",
            Priority = TaskPriority.Medium,
            Status = WorkTaskStatus.Todo
        });
        await _context.SaveChangesAsync();

        var command = new CreateTaskCommand(
            Code: "",
            Title: "Next Task",
            Description: null,
            AssigneeId: null,
            AssignerId: null,
            Priority: "Low",
            Status: "Todo",
            StartDate: null,
            DueDate: null,
            Progress: 0,
            ProjectId: null,
            ParentTaskId: null
        );

        var handler = new CreateTaskCommandHandler(_context, _notificationServiceMock.Object);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Code.Should().Be($"{yearSuffix}-TAS-002");
    }
}
