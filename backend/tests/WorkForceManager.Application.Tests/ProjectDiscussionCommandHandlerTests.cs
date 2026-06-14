using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Projects.Discussions.Commands.AddProjectComment;
using WorkForceManager.Application.Features.Projects.Discussions.Commands.DeleteProjectComment;
using WorkForceManager.Application.Features.Projects.Discussions.Queries.GetProjectComments;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class ProjectDiscussionCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();
    private readonly Mock<IFileStorageService> _fileStorage = new();

    public ProjectDiscussionCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _currentUser.Setup(x => x.UserName).Returns("test_user");
        _dateTime.Setup(x => x.UtcNow).Returns(DateTime.UtcNow);

        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
    }

    private async Task<(Project project, Employee member, Employee outsider)> SeedAsync()
    {
        var project = new Project
        {
            Code = "PD1", Name = "Project Discussion", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(1),
            Status = ProjectStatus.InProgress
        };
        _context.Projects.Add(project);

        var member = new Employee { EmployeeCode = "EMP-M", FullName = "Member Employee" };
        var outsider = new Employee { EmployeeCode = "EMP-O", FullName = "Outsider Employee" };
        _context.Employees.AddRange(member, outsider);
        await _context.SaveChangesAsync();

        project.Members.Add(new ProjectMember
        {
            ProjectId = project.Id,
            EmployeeId = member.Id,
            RoleInProject = "Thành viên",
            JoinedDate = DateTime.UtcNow,
            Employee = member
        });
        await _context.SaveChangesAsync();

        return (project, member, outsider);
    }

    [Fact]
    public async Task AddComment_AsMember_WithContentOnly_ShouldSucceed()
    {
        var (project, member, _) = await SeedAsync();
        _currentUser.Setup(x => x.EmployeeId).Returns(member.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        var handler = new AddProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new AddProjectCommentCommand(project.Id, "Một bình luận test", null);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data!.Content.Should().Be("Một bình luận test");
        result.Data.AuthorId.Should().Be(member.Id);
        result.Data.Attachments.Should().BeEmpty();
    }

    [Fact]
    public async Task AddComment_AsMember_WithFile_ShouldSaveAttachment()
    {
        var (project, member, _) = await SeedAsync();
        _currentUser.Setup(x => x.EmployeeId).Returns(member.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        _fileStorage
            .Setup(x => x.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(("guid_report.pdf", 1024L));

        var content = new MemoryStream(new byte[] { 1, 2, 3, 4 });
        var formFile = new FormFile(content, 0, content.Length, "files", "report.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf"
        };

        var handler = new AddProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new AddProjectCommentCommand(project.Id, "Báo cáo đính kèm", new List<IFormFile> { formFile });

        var result = await handler.Handle(command, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data!.Attachments.Should().ContainSingle();
        result.Data.Attachments[0].FileName.Should().Be("report.pdf");
        result.Data.Attachments[0].FileSizeBytes.Should().Be(1024L);
    }

    [Fact]
    public async Task AddComment_AsNonMemberWithoutManagePolicy_ShouldThrowForbidden()
    {
        var (project, _, outsider) = await SeedAsync();
        _currentUser.Setup(x => x.EmployeeId).Returns(outsider.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        var handler = new AddProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new AddProjectCommentCommand(project.Id, "Không được phép", null);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task AddComment_NonExistentProject_ShouldThrowNotFound()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(1);
        _currentUser.Setup(x => x.Role).Returns(UserRole.SuperAdmin);

        var handler = new AddProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new AddProjectCommentCommand(99999, "Test", null);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteComment_AsAuthor_ShouldSucceed()
    {
        var (project, member, _) = await SeedAsync();
        var comment = new ProjectComment { ProjectId = project.Id, AuthorId = member.Id, Content = "Bình luận của tôi" };
        _context.ProjectComments.Add(comment);
        await _context.SaveChangesAsync();

        _currentUser.Setup(x => x.EmployeeId).Returns(member.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        var handler = new DeleteProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new DeleteProjectCommentCommand(project.Id, comment.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Success.Should().BeTrue();
        var deleted = await _context.ProjectComments.IgnoreQueryFilters().FirstAsync(c => c.Id == comment.Id);
        deleted.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteComment_AsNonAuthorWithoutManagePolicy_ShouldThrowForbidden()
    {
        var (project, member, outsider) = await SeedAsync();
        var comment = new ProjectComment { ProjectId = project.Id, AuthorId = member.Id, Content = "Bình luận của member" };
        _context.ProjectComments.Add(comment);
        await _context.SaveChangesAsync();

        _currentUser.Setup(x => x.EmployeeId).Returns(outsider.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        var handler = new DeleteProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new DeleteProjectCommentCommand(project.Id, comment.Id);

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task DeleteComment_AsManagerWithManagePolicy_ShouldSucceedEvenIfNotAuthor()
    {
        var (project, member, outsider) = await SeedAsync();
        var comment = new ProjectComment { ProjectId = project.Id, AuthorId = member.Id, Content = "Bình luận của member" };
        _context.ProjectComments.Add(comment);
        await _context.SaveChangesAsync();

        _currentUser.Setup(x => x.EmployeeId).Returns(outsider.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Manager);

        var handler = new DeleteProjectCommentCommandHandler(_context, _currentUser.Object, _fileStorage.Object);
        var command = new DeleteProjectCommentCommand(project.Id, comment.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetProjectComments_ShouldReturnPaginatedNewestFirst()
    {
        var (project, member, _) = await SeedAsync();

        for (var i = 1; i <= 3; i++)
        {
            _context.ProjectComments.Add(new ProjectComment
            {
                ProjectId = project.Id,
                AuthorId = member.Id,
                Content = $"Bình luận {i}",
                CreatedDate = DateTime.UtcNow.AddMinutes(i)
            });
        }
        await _context.SaveChangesAsync();

        _currentUser.Setup(x => x.EmployeeId).Returns(member.Id);
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);

        var handler = new GetProjectCommentsQueryHandler(_context, _currentUser.Object);
        var query = new GetProjectCommentsQuery(project.Id, 1, 2);

        var result = await handler.Handle(query, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data!.Items.Should().HaveCount(2);
        result.Data.TotalCount.Should().Be(3);
        result.Data.Items[0].Content.Should().Be("Bình luận 3");
    }
}
