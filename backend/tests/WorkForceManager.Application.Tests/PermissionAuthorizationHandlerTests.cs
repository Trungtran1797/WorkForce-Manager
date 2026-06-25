using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Moq;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class PermissionAuthorizationHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IPermissionService> _permissionService = new();
    private readonly PermissionAuthorizationHandler _handler;

    public PermissionAuthorizationHandlerTests()
    {
        _handler = new PermissionAuthorizationHandler(_currentUser.Object, _permissionService.Object);
    }

    private static AuthorizationHandlerContext CreateContext(PermissionRequirement requirement)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());
        return new AuthorizationHandlerContext(new[] { requirement }, user, null);
    }

    [Fact]
    public async Task HandleRequirementAsync_Should_Succeed_When_RoleIsSuperAdmin()
    {
        // Arrange
        _currentUser.Setup(x => x.Role).Returns(UserRole.SuperAdmin);
        var requirement = new PermissionRequirement(PermissionModule.Payroll, PermissionLevel.Edit);
        var context = CreateContext(requirement);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeTrue();
        _permissionService.Verify(
            x => x.GetEffectiveLevelAsync(It.IsAny<UserRole>(), It.IsAny<int?>(), It.IsAny<PermissionModule>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleRequirementAsync_Should_Succeed_When_EffectiveLevelMeetsMinLevel()
    {
        // Arrange: Manager with Edit on Tasks, requirement MinLevel=Edit
        _currentUser.Setup(x => x.Role).Returns(UserRole.Manager);
        _currentUser.Setup(x => x.DepartmentId).Returns(2);
        _permissionService
            .Setup(x => x.GetEffectiveLevelAsync(UserRole.Manager, 2, PermissionModule.Tasks, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PermissionLevel.Edit);

        var requirement = new PermissionRequirement(PermissionModule.Tasks, PermissionLevel.Edit);
        var context = CreateContext(requirement);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleRequirementAsync_Should_NotSucceed_When_EffectiveLevelBelowMinLevel()
    {
        // Arrange: Employee with View on Departments, requirement MinLevel=Edit
        _currentUser.Setup(x => x.Role).Returns(UserRole.Employee);
        _currentUser.Setup(x => x.DepartmentId).Returns(3);
        _permissionService
            .Setup(x => x.GetEffectiveLevelAsync(UserRole.Employee, 3, PermissionModule.Departments, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PermissionLevel.View);

        var requirement = new PermissionRequirement(PermissionModule.Departments, PermissionLevel.Edit);
        var context = CreateContext(requirement);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeFalse();
    }

    [Fact]
    public async Task HandleRequirementAsync_Should_NotSucceed_When_RoleIsNull()
    {
        // Arrange: unauthenticated / no role claim
        _currentUser.Setup(x => x.Role).Returns((UserRole?)null);

        var requirement = new PermissionRequirement(PermissionModule.Tasks, PermissionLevel.View);
        var context = CreateContext(requirement);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeFalse();
        _permissionService.Verify(
            x => x.GetEffectiveLevelAsync(It.IsAny<UserRole>(), It.IsAny<int?>(), It.IsAny<PermissionModule>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
