using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Commands.DeleteProject;
using WorkForceManager.Application.Features.Tasks.Commands.DeleteTask;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class DeleteProjectAndTaskCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;

    public DeleteProjectAndTaskCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(x => x.UserName).Returns("test_user");
        _currentUserServiceMock.Setup(x => x.Role).Returns(WorkForceManager.Domain.Enums.UserRole.SuperAdmin);

        var currentUserServiceMock = _currentUserServiceMock;

        var dateTimeServiceMock = new Mock<IDateTimeService>();
        dateTimeServiceMock.Setup(x => x.Now).Returns(DateTime.Now);
        dateTimeServiceMock.Setup(x => x.UtcNow).Returns(DateTime.UtcNow);

        var auditInterceptor = new AuditableEntitySaveChangesInterceptor(
            currentUserServiceMock.Object,
            dateTimeServiceMock.Object
        );

        _context = new ApplicationDbContext(options, auditInterceptor);
    }

    [Fact]
    public async Task Handle_DeleteProject_ShouldCascadeSoftDeleteAllRelatedEntities()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test Project", Code = "PRJ-01" };
        _context.Projects.Add(project);

        var member = new ProjectMember { Id = 1, ProjectId = 1, EmployeeId = 1, RoleInProject = "Developer" };
        _context.ProjectMembers.Add(member);

        var comment = new ProjectComment { Id = 1, ProjectId = 1, AuthorId = 1, Content = "Project Comment" };
        _context.ProjectComments.Add(comment);

        var attachment = new ProjectAttachment { Id = 1, ProjectId = 1, FileName = "doc.pdf", StoredFileName = "stored.pdf", UploadedById = 1 };
        _context.ProjectAttachments.Add(attachment);

        var task = new TaskItem { Id = 1, ProjectId = 1, Title = "Parent Task", Code = "PRJ-01-01" };
        _context.Tasks.Add(task);

        var subtask = new TaskItem { Id = 2, ProjectId = 1, ParentTaskId = 1, Title = "Child Task", Code = "PRJ-01-01-01" };
        _context.Tasks.Add(subtask);

        var taskComment = new TaskComment { Id = 1, TaskId = 1, AuthorId = 1, Content = "Task Comment" };
        _context.TaskComments.Add(taskComment);

        var taskAttachment = new TaskAttachment { Id = 1, TaskId = 2, FileName = "task_doc.pdf", StoredFileName = "task_stored.pdf", UploadedById = 1 };
        _context.TaskAttachments.Add(taskAttachment);

        await _context.SaveChangesAsync();

        var handler = new DeleteProjectCommandHandler(_context);

        // Act
        await handler.Handle(new DeleteProjectCommand(1), CancellationToken.None);

        // Assert
        // Global query filter is enabled by default in _context. Use IgnoreQueryFilters to check IsDeleted property in DB.
        var projectInDb = await _context.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == 1);
        projectInDb.Should().NotBeNull();
        projectInDb!.IsDeleted.Should().BeTrue();

        var memberInDb = await _context.ProjectMembers.IgnoreQueryFilters().FirstOrDefaultAsync(pm => pm.Id == 1);
        memberInDb.Should().NotBeNull();
        memberInDb!.IsDeleted.Should().BeTrue();

        var commentInDb = await _context.ProjectComments.IgnoreQueryFilters().FirstOrDefaultAsync(pc => pc.Id == 1);
        commentInDb.Should().NotBeNull();
        commentInDb!.IsDeleted.Should().BeTrue();

        var attachmentInDb = await _context.ProjectAttachments.IgnoreQueryFilters().FirstOrDefaultAsync(pa => pa.Id == 1);
        attachmentInDb.Should().NotBeNull();
        attachmentInDb!.IsDeleted.Should().BeTrue();

        var taskInDb = await _context.Tasks.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == 1);
        taskInDb.Should().NotBeNull();
        taskInDb!.IsDeleted.Should().BeTrue();

        var subtaskInDb = await _context.Tasks.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == 2);
        subtaskInDb.Should().NotBeNull();
        subtaskInDb!.IsDeleted.Should().BeTrue();

        var taskCommentInDb = await _context.TaskComments.IgnoreQueryFilters().FirstOrDefaultAsync(tc => tc.Id == 1);
        taskCommentInDb.Should().NotBeNull();
        taskCommentInDb!.IsDeleted.Should().BeTrue();

        var taskAttachmentInDb = await _context.TaskAttachments.IgnoreQueryFilters().FirstOrDefaultAsync(ta => ta.Id == 1);
        taskAttachmentInDb.Should().NotBeNull();
        taskAttachmentInDb!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_DeleteTask_ShouldCascadeSoftDeleteSubtasksRecursivelyAndCommentsAttachments()
    {
        // Arrange
        var parentTask = new TaskItem { Id = 10, Title = "Root Task", Code = "TASK-10" };
        _context.Tasks.Add(parentTask);

        var childTask = new TaskItem { Id = 11, ParentTaskId = 10, Title = "Child Task 1", Code = "TASK-11" };
        _context.Tasks.Add(childTask);

        var grandChildTask = new TaskItem { Id = 12, ParentTaskId = 11, Title = "Grandchild Task 1", Code = "TASK-12" };
        _context.Tasks.Add(grandChildTask);

        var taskComment = new TaskComment { Id = 10, TaskId = 12, AuthorId = 1, Content = "Grandchild Comment" };
        _context.TaskComments.Add(taskComment);

        var taskAttachment = new TaskAttachment { Id = 10, TaskId = 11, FileName = "child_doc.pdf", StoredFileName = "child_stored.pdf", UploadedById = 1 };
        _context.TaskAttachments.Add(taskAttachment);

        await _context.SaveChangesAsync();

        var handler = new DeleteTaskCommandHandler(_context, _currentUserServiceMock.Object);

        // Act
        await handler.Handle(new DeleteTaskCommand(10), CancellationToken.None);

        // Assert
        var rootInDb = await _context.Tasks.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == 10);
        rootInDb.Should().NotBeNull();
        rootInDb!.IsDeleted.Should().BeTrue();

        var childInDb = await _context.Tasks.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == 11);
        childInDb.Should().NotBeNull();
        childInDb!.IsDeleted.Should().BeTrue();

        var grandChildInDb = await _context.Tasks.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == 12);
        grandChildInDb.Should().NotBeNull();
        grandChildInDb!.IsDeleted.Should().BeTrue();

        var commentInDb = await _context.TaskComments.IgnoreQueryFilters().FirstOrDefaultAsync(tc => tc.Id == 10);
        commentInDb.Should().NotBeNull();
        commentInDb!.IsDeleted.Should().BeTrue();

        var attachmentInDb = await _context.TaskAttachments.IgnoreQueryFilters().FirstOrDefaultAsync(ta => ta.Id == 10);
        attachmentInDb.Should().NotBeNull();
        attachmentInDb!.IsDeleted.Should().BeTrue();
    }
}
