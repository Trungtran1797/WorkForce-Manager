using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Tasks.Commands.CreateTask;
using WorkForceManager.Application.Features.Tasks.Commands.UpdateTask;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class TaskSubtaskValidationTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public TaskSubtaskValidationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _currentUser.Setup(x => x.UserName).Returns("test_user");
        _dateTime.Setup(x => x.UtcNow).Returns(DateTime.UtcNow);

        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
    }

    private async Task<(Project projectA, Project projectB, TaskItem parentTask, TaskItem subTask)> SeedAsync()
    {
        var projectA = new Project
        {
            Code = "PA", Name = "Project A", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(1),
            Status = ProjectStatus.InProgress
        };
        var projectB = new Project
        {
            Code = "PB", Name = "Project B", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(1),
            Status = ProjectStatus.InProgress
        };
        _context.Projects.AddRange(projectA, projectB);
        await _context.SaveChangesAsync();

        var parentTask = new TaskItem
        {
            Code = "PARENT-1", Title = "Parent Task", Priority = TaskPriority.Medium,
            Status = WorkTaskStatus.Todo, ProjectId = projectA.Id
        };
        _context.Tasks.Add(parentTask);
        await _context.SaveChangesAsync();

        var subTask = new TaskItem
        {
            Code = "SUB-1", Title = "Sub Task", Priority = TaskPriority.Medium,
            Status = WorkTaskStatus.Todo, ProjectId = projectA.Id, ParentTaskId = parentTask.Id
        };
        _context.Tasks.Add(subTask);
        await _context.SaveChangesAsync();

        return (projectA, projectB, parentTask, subTask);
    }

    [Fact]
    public async Task CreateTask_WithValidParentTaskId_ShouldPass()
    {
        var (projectA, _, parentTask, _) = await SeedAsync();
        var validator = new CreateTaskCommandValidator(_context);

        var command = new CreateTaskCommand(
            "NEW-1", "New Subtask", null, null, null,
            nameof(TaskPriority.Medium), nameof(WorkTaskStatus.Todo), null, null, 0,
            projectA.Id, parentTask.Id, null);

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task CreateTask_WithNonExistentParentTaskId_ShouldFail()
    {
        var (projectA, _, _, _) = await SeedAsync();
        var validator = new CreateTaskCommandValidator(_context);

        var command = new CreateTaskCommand(
            "NEW-2", "New Subtask", null, null, null,
            nameof(TaskPriority.Medium), nameof(WorkTaskStatus.Todo), null, null, 0,
            projectA.Id, 99999, null);

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Công việc cha không tồn tại"));
    }

    [Fact]
    public async Task CreateTask_WithParentBeingASubtask_ShouldFail()
    {
        var (projectA, _, _, subTask) = await SeedAsync();
        var validator = new CreateTaskCommandValidator(_context);

        var command = new CreateTaskCommand(
            "NEW-3", "Nested subtask", null, null, null,
            nameof(TaskPriority.Medium), nameof(WorkTaskStatus.Todo), null, null, 0,
            projectA.Id, subTask.Id, null);

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Chỉ hỗ trợ tối đa 1 cấp"));
    }

    [Fact]
    public async Task CreateTask_WithDifferentProjectIdThanParent_ShouldFail()
    {
        var (_, projectB, parentTask, _) = await SeedAsync();
        var validator = new CreateTaskCommandValidator(_context);

        var command = new CreateTaskCommand(
            "NEW-4", "Subtask in other project", null, null, null,
            nameof(TaskPriority.Medium), nameof(WorkTaskStatus.Todo), null, null, 0,
            projectB.Id, parentTask.Id, null);

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("phải thuộc cùng dự án"));
    }

    [Fact]
    public async Task UpdateTask_WithSelfAsParent_ShouldFail()
    {
        var (projectA, _, parentTask, _) = await SeedAsync();
        var validator = new UpdateTaskCommandValidator(_context);

        var command = new UpdateTaskCommand(
            parentTask.Id, parentTask.Code, parentTask.Title, null, null, null,
            nameof(TaskPriority.Medium), nameof(WorkTaskStatus.Todo), null, null, 0,
            projectA.Id, parentTask.Id, null);

        var result = await validator.ValidateAsync(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("không thể là công việc cha của chính nó"));
    }

    [Fact]
    public async Task GetTasks_WithParentTaskIdFilter_ShouldReturnOnlySubtasksWithComputedFields()
    {
        var (_, _, parentTask, subTask) = await SeedAsync();

        var query = new Application.Features.Tasks.Queries.GetTasks.GetTasksQuery(null, null, null, null, parentTask.Id);
        var handler = new Application.Features.Tasks.Queries.GetTasks.GetTasksQueryHandler(_context);

        var result = await handler.Handle(query, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Id.Should().Be(subTask.Id);
        result[0].ParentTaskId.Should().Be(parentTask.Id);
        result[0].ParentTaskTitle.Should().Be(parentTask.Title);
    }

    [Fact]
    public async Task GetTasks_ForParentTask_ShouldReturnCorrectSubTaskCount()
    {
        var (_, _, parentTask, _) = await SeedAsync();

        var query = new Application.Features.Tasks.Queries.GetTasks.GetTasksQuery(null, null, null, parentTask.Code, null);
        var handler = new Application.Features.Tasks.Queries.GetTasks.GetTasksQueryHandler(_context);

        var result = await handler.Handle(query, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].SubTaskCount.Should().Be(1);
    }
}
