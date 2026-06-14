using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Training.Commands.CompleteTraining;
using WorkForceManager.Application.Features.Training.Commands.EnrollTraining;
using WorkForceManager.Application.Features.Training.Commands.SaveCourse;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class TrainingCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public TrainingCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.UtcNow).Returns(new DateTime(2026, 6, 14, 9, 0, 0, DateTimeKind.Utc));

        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Nhân viên" });
        _context.SaveChanges();
    }

    [Fact]
    public async Task SaveCourse_ShouldCreateCourse()
    {
        var handler = new SaveCourseCommandHandler(_context);
        var result = await handler.Handle(new SaveCourseCommand(0, "ASP.NET Core nâng cao", "Khóa học backend", "Mr. A", "2026-07-01", null), CancellationToken.None);

        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("ASP.NET Core nâng cao");
    }

    [Fact]
    public async Task Enroll_ShouldCreateEnrollment_AndThrowConflictOnDuplicate()
    {
        var course = new TrainingCourse { Name = "Khóa A", StartDate = new DateTime(2026, 7, 1) };
        _context.TrainingCourses.Add(course);
        await _context.SaveChangesAsync();

        var handler = new EnrollTrainingCommandHandler(_context);
        var result = await handler.Handle(new EnrollTrainingCommand(course.Id, 1), CancellationToken.None);

        result.Status.Should().Be(TrainingStatus.Enrolled.ToString());

        Func<Task> act = () => handler.Handle(new EnrollTrainingCommand(course.Id, 1), CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CompleteTraining_ShouldSetCompletedDateAndCertificate()
    {
        var course = new TrainingCourse { Name = "Khóa B", StartDate = new DateTime(2026, 7, 1) };
        var enrollment = new TrainingEnrollment { Course = course, EmployeeId = 1, Status = TrainingStatus.Enrolled };
        _context.TrainingCourses.Add(course);
        _context.TrainingEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        var handler = new CompleteTrainingCommandHandler(_context, _dateTime.Object);
        var result = await handler.Handle(new CompleteTrainingCommand(enrollment.Id, nameof(TrainingStatus.Completed), "CERT-001"), CancellationToken.None);

        result.Status.Should().Be(TrainingStatus.Completed.ToString());
        result.CertificateCode.Should().Be("CERT-001");
        result.CompletedDate.Should().Be("2026-06-14");
    }
}
