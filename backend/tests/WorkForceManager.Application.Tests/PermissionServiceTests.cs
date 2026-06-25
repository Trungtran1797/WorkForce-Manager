using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class PermissionServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly PermissionService _service;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public PermissionServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.UtcNow).Returns(new DateTime(2026, 6, 15, 9, 0, 0, DateTimeKind.Utc));

        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new PermissionService(_context, _cache);
    }

    [Fact]
    public async Task GetEffectivePermissionsAsync_Should_ReturnEditForAllModules_When_RoleIsSuperAdmin()
    {
        // Act
        var permissions = await _service.GetEffectivePermissionsAsync(UserRole.SuperAdmin, null, CancellationToken.None);

        // Assert
        var allModules = Enum.GetValues<PermissionModule>();
        permissions.Should().HaveCount(allModules.Length);
        permissions.Values.Should().OnlyContain(level => level == PermissionLevel.Edit);
    }

    [Fact]
    public async Task GetEffectivePermissionsAsync_Should_ReturnMaxOfRoleAndDepartmentOverride_When_OverrideIsHigher()
    {
        // Arrange: Manager role-default for Shifts = View; department override for Shifts = Edit
        _context.RolePermissions.Add(new RolePermission { Role = UserRole.Manager, Module = PermissionModule.Shifts, Level = PermissionLevel.View });
        _context.RolePermissions.Add(new RolePermission { Role = UserRole.Manager, Module = PermissionModule.Tasks, Level = PermissionLevel.Edit });

        var department = new Department { Name = "Phòng Sản xuất" };
        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        _context.DepartmentPermissionOverrides.Add(new DepartmentPermissionOverride
        {
            DepartmentId = department.Id,
            Module = PermissionModule.Shifts,
            Level = PermissionLevel.Edit
        });
        await _context.SaveChangesAsync();

        // Act
        var permissions = await _service.GetEffectivePermissionsAsync(UserRole.Manager, department.Id, CancellationToken.None);

        // Assert: effective = max(role-default View, override Edit) = Edit
        permissions[PermissionModule.Shifts].Should().Be(PermissionLevel.Edit);
        // Module not affected by override keeps role-default
        permissions[PermissionModule.Tasks].Should().Be(PermissionLevel.Edit);
    }

    [Fact]
    public async Task GetEffectiveLevelAsync_Should_ReturnNone_When_ModuleHasNoConfiguredRow()
    {
        // Arrange: no RolePermission rows seeded at all for Manager
        // Act
        var level = await _service.GetEffectiveLevelAsync(UserRole.Manager, null, PermissionModule.Payroll, CancellationToken.None);

        // Assert
        level.Should().Be(PermissionLevel.None);
    }

    [Fact]
    public async Task InvalidateCache_Should_ReflectUpdatedDbData_When_CalledAfterChange()
    {
        // Arrange: initial RolePermission = View
        var rolePermission = new RolePermission { Role = UserRole.Employee, Module = PermissionModule.Reports, Level = PermissionLevel.View };
        _context.RolePermissions.Add(rolePermission);
        await _context.SaveChangesAsync();

        var initialLevel = await _service.GetEffectiveLevelAsync(UserRole.Employee, null, PermissionModule.Reports, CancellationToken.None);
        initialLevel.Should().Be(PermissionLevel.View);

        // Act: update DB directly then invalidate cache
        rolePermission.Level = PermissionLevel.Edit;
        await _context.SaveChangesAsync();
        _service.InvalidateCache();

        var updatedLevel = await _service.GetEffectiveLevelAsync(UserRole.Employee, null, PermissionModule.Reports, CancellationToken.None);

        // Assert
        updatedLevel.Should().Be(PermissionLevel.Edit);
    }

    [Fact]
    public async Task GetEffectiveLevelAsync_Should_ReturnStaleValue_When_CacheNotInvalidated()
    {
        // Arrange
        var rolePermission = new RolePermission { Role = UserRole.Employee, Module = PermissionModule.Notifications, Level = PermissionLevel.View };
        _context.RolePermissions.Add(rolePermission);
        await _context.SaveChangesAsync();

        var initialLevel = await _service.GetEffectiveLevelAsync(UserRole.Employee, null, PermissionModule.Notifications, CancellationToken.None);
        initialLevel.Should().Be(PermissionLevel.View);

        // Act: update DB but DO NOT invalidate cache
        rolePermission.Level = PermissionLevel.Edit;
        await _context.SaveChangesAsync();

        var cachedLevel = await _service.GetEffectiveLevelAsync(UserRole.Employee, null, PermissionModule.Notifications, CancellationToken.None);

        // Assert: cache still serves the old value
        cachedLevel.Should().Be(PermissionLevel.View);
    }
}
