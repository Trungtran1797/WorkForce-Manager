using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Commands.ChangePassword;
using WorkForceManager.Application.Features.Employees.Commands.UpdateMyProfile;
using WorkForceManager.Application.Features.Employees.Queries.GetMyProfile;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class SelfServiceCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();

    public SelfServiceCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.UtcNow).Returns(new DateTime(2026, 6, 26, 9, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task GetMyProfile_ShouldReturnProfile_WhenEmployeeIdExists()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(1);

        var dept = new Department { Id = 1, Name = "Kinh doanh" };
        var emp = new Employee
        {
            Id = 1,
            EmployeeCode = "NV001",
            FullName = "Nguyễn Văn An",
            Department = dept,
            Gender = Gender.Male,
            Status = EmployeeStatus.Active
        };
        _context.Departments.Add(dept);
        _context.Employees.Add(emp);
        await _context.SaveChangesAsync();

        var handler = new GetMyProfileQueryHandler(_context, _currentUser.Object);
        var result = await handler.Handle(new GetMyProfileQuery(), CancellationToken.None);

        result.EmployeeCode.Should().Be("NV001");
        result.FullName.Should().Be("Nguyễn Văn An");
        result.DepartmentName.Should().Be("Kinh doanh");
    }

    [Fact]
    public async Task GetMyProfile_ShouldThrowNotFound_WhenEmployeeIdIsNull()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns((int?)null);

        var handler = new GetMyProfileQueryHandler(_context, _currentUser.Object);
        Func<Task> act = () => handler.Handle(new GetMyProfileQuery(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateMyProfile_ShouldUpdateDetails_AndSyncEmailToUser()
    {
        _currentUser.Setup(x => x.EmployeeId).Returns(1);
        _currentUser.Setup(x => x.UserId).Returns(2);

        var dept = new Department { Id = 1, Name = "Kinh doanh" };
        var emp = new Employee
        {
            Id = 1,
            EmployeeCode = "NV001",
            FullName = "Nguyễn Văn An",
            PhoneNumber = "0987654321",
            Email = "old@workforce.local",
            Department = dept
        };
        var user = new User
        {
            Id = 2,
            Username = "an.nguyen",
            Email = "old@workforce.local",
            EmployeeId = 1
        };

        _context.Departments.Add(dept);
        _context.Employees.Add(emp);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var handler = new UpdateMyProfileCommandHandler(_context, _currentUser.Object);
        var command = new UpdateMyProfileCommand("0999999999", "new@workforce.local", "Hà Nội", "Hà Nội", "Độc thân");
        var result = await handler.Handle(command, CancellationToken.None);

        result.PhoneNumber.Should().Be("0999999999");
        result.Email.Should().Be("new@workforce.local");

        var updatedUser = await _context.Users.FindAsync(2);
        updatedUser!.Email.Should().Be("new@workforce.local");
    }

    [Fact]
    public async Task ChangePassword_ShouldUpdateHash_WhenCurrentPasswordIsValid()
    {
        _currentUser.Setup(x => x.UserId).Returns(1);
        
        var user = new User
        {
            Id = 1,
            Username = "user",
            PasswordHash = "old_hashed"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.Setup(x => x.Verify("old_hashed", "OldPassword@123")).Returns(true);
        _passwordHasher.Setup(x => x.Hash("NewPassword@123")).Returns("new_hashed");

        var handler = new ChangePasswordCommandHandler(_context, _currentUser.Object, _passwordHasher.Object);
        var command = new ChangePasswordCommand("OldPassword@123", "NewPassword@123");
        await handler.Handle(command, CancellationToken.None);

        var updatedUser = await _context.Users.FindAsync(1);
        updatedUser!.PasswordHash.Should().Be("new_hashed");
    }

    [Fact]
    public async Task ChangePassword_ShouldThrowValidationException_WhenCurrentPasswordIsInvalid()
    {
        _currentUser.Setup(x => x.UserId).Returns(1);
        
        var user = new User
        {
            Id = 1,
            Username = "user",
            PasswordHash = "old_hashed"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.Setup(x => x.Verify("old_hashed", "WrongPassword")).Returns(false);

        var handler = new ChangePasswordCommandHandler(_context, _currentUser.Object, _passwordHasher.Object);
        var command = new ChangePasswordCommand("WrongPassword", "NewPassword@123");
        Func<Task> act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }
}
