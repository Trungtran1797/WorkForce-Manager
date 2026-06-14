using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.WebApi.Controllers;
using Xunit;

namespace WorkForceManager.WebApi.IntegrationTests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Login_ShouldReturnSuccess_WhenCredentialsAreCorrect()
    {
        // Arrange: Seed a user in the test database
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

            // Clean up existing users first to ensure a clean state
            context.Users.RemoveRange(context.Users);
            await context.SaveChangesAsync();

            var testUser = new User
            {
                Username = "testuser",
                Email = "testuser@workforce.local",
                PasswordHash = hasher.Hash("Password@123"),
                Role = UserRole.SuperAdmin,
                IsActive = true
            };
            context.Users.Add(testUser);
            await context.SaveChangesAsync();
        }

        var requestBody = new LoginRequest("testuser", "Password@123");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", requestBody);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var jsonResult = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<AuthResponse>>();
        jsonResult.Should().NotBeNull();
        jsonResult!.Success.Should().BeTrue();
        jsonResult.Data.Should().NotBeNull();
        jsonResult.Data!.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsIncorrect()
    {
        // Arrange
        var requestBody = new LoginRequest("testuser", "WrongPassword");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", requestBody);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

// Lớp giả lập wrapper response khớp với định dạng trả về của API
public class ApiResponseWrapper<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}
