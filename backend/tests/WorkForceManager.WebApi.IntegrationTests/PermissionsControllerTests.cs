using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Common;
using WorkForceManager.Application.Features.Permissions.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.WebApi.Controllers;
using Xunit;

namespace WorkForceManager.WebApi.IntegrationTests;

public class PermissionsControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public PermissionsControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    /// <summary>
    /// Đảm bảo DB test (InMemory) có đủ user (SuperAdmin/Manager/Employee) + 60 RolePermission (3 role x 20 module).
    /// Idempotent: chỉ seed nếu chưa có.
    /// </summary>
    private async Task SeedAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        if (!await context.Users.AnyAsync(u => u.Username == "perm_admin"))
        {
            context.Users.Add(new User
            {
                Username = "perm_admin",
                Email = "perm_admin@workforce.local",
                PasswordHash = hasher.Hash("Password@123"),
                Role = UserRole.SuperAdmin,
                IsActive = true
            });
        }

        if (!await context.Users.AnyAsync(u => u.Username == "perm_manager"))
        {
            context.Users.Add(new User
            {
                Username = "perm_manager",
                Email = "perm_manager@workforce.local",
                PasswordHash = hasher.Hash("Password@123"),
                Role = UserRole.Manager,
                IsActive = true
            });
        }

        if (!await context.Users.AnyAsync(u => u.Username == "perm_employee"))
        {
            context.Users.Add(new User
            {
                Username = "perm_employee",
                Email = "perm_employee@workforce.local",
                PasswordHash = hasher.Hash("Password@123"),
                Role = UserRole.Employee,
                IsActive = true
            });
        }

        await context.SaveChangesAsync();

        if (!await context.RolePermissions.AnyAsync())
        {
            var rolePermissions = new List<RolePermission>();
            foreach (var module in Enum.GetValues<PermissionModule>())
            {
                rolePermissions.Add(new RolePermission { Role = UserRole.SuperAdmin, Module = module, Level = PermissionLevel.Edit });
                rolePermissions.Add(new RolePermission { Role = UserRole.Manager, Module = module, Level = PermissionLevel.View });
                rolePermissions.Add(new RolePermission { Role = UserRole.Employee, Module = module, Level = PermissionLevel.None });
            }

            context.RolePermissions.AddRange(rolePermissions);
            await context.SaveChangesAsync();
        }

        if (!await context.Departments.AnyAsync())
        {
            context.Departments.Add(new Department { Name = "Phòng Test" });
            await context.SaveChangesAsync();
        }
    }

    private async Task<string> LoginAsync(string username)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, "Password@123"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<AuthResponse>>();
        result!.Data!.AccessToken.Should().NotBeNullOrEmpty();
        return result.Data!.AccessToken;
    }

    [Fact]
    public async Task GetMatrix_Should_ReturnSixtyRolePermissionsAndOverrides_When_RequestedBySuperAdmin()
    {
        // Arrange
        await SeedAsync();
        var token = await LoginAsync("perm_admin");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/permissions/matrix");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<PermissionMatrixDto>>();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.RolePermissions.Should().HaveCount(63);
        result.Data!.Modules.Should().HaveCount(21);
        result.Data!.Roles.Should().HaveCount(3);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateMatrix_Should_PersistChange_When_RequestedBySuperAdmin()
    {
        // Arrange
        await SeedAsync();
        var token = await LoginAsync("perm_admin");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var getResponse = await _client.GetAsync("/api/v1/permissions/matrix");
        var matrix = (await getResponse.Content.ReadFromJsonAsync<ApiResponseWrapper<PermissionMatrixDto>>())!.Data!;

        // Modify Manager.Reports -> Edit (was View by seed)
        var updatedRolePermissions = matrix.RolePermissions
            .Select(rp => rp.Role == nameof(UserRole.Manager) && rp.Module == nameof(PermissionModule.Reports)
                ? rp with { Level = nameof(PermissionLevel.Edit) }
                : rp)
            .ToList();

        var command = new UpdatePermissionMatrixRequest(updatedRolePermissions, matrix.DepartmentOverrides);

        // Act
        var putResponse = await _client.PutAsJsonAsync("/api/v1/permissions/matrix", command);

        // Assert
        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getAfter = await _client.GetAsync("/api/v1/permissions/matrix");
        var matrixAfter = (await getAfter.Content.ReadFromJsonAsync<ApiResponseWrapper<PermissionMatrixDto>>())!.Data!;

        matrixAfter.RolePermissions
            .Single(rp => rp.Role == nameof(UserRole.Manager) && rp.Module == nameof(PermissionModule.Reports))
            .Level.Should().Be(nameof(PermissionLevel.Edit));

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Theory]
    [InlineData("perm_manager")]
    [InlineData("perm_employee")]
    public async Task GetMatrix_Should_ReturnForbidden_When_RequestedByNonSuperAdmin(string username)
    {
        // Arrange
        await SeedAsync();
        var token = await LoginAsync(username);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/permissions/matrix");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Theory]
    [InlineData("perm_admin")]
    [InlineData("perm_manager")]
    [InlineData("perm_employee")]
    public async Task GetMyPermissions_Should_ReturnTwentyModuleKeys_When_RequestedByAuthenticatedUser(string username)
    {
        // Arrange
        await SeedAsync();
        var token = await LoginAsync(username);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/permissions/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<Dictionary<string, string>>>();
        result!.Success.Should().BeTrue();
        result.Data.Should().HaveCount(21);

        _client.DefaultRequestHeaders.Authorization = null;
    }
}

/// <summary>DTO request cho PUT /permissions/matrix (cùng shape với UpdatePermissionMatrixCommand).</summary>
public record UpdatePermissionMatrixRequest(
    List<RolePermissionDto> RolePermissions,
    List<DepartmentPermissionOverrideDto> DepartmentOverrides);
