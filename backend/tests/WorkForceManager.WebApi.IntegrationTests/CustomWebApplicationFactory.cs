using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Infrastructure.Persistence;

namespace WorkForceManager.WebApi.IntegrationTests;

public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Đặt môi trường là "Testing" để tránh chạy Auto-Seed / Migration trong Program.cs
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Tìm và xóa toàn bộ Service Descriptor liên quan đến DbContext hoặc DbContextOptions để tránh xung đột Provider
            var descriptors = services.Where(d => 
                d.ServiceType.Name.Contains("DbContextOptions") || 
                d.ServiceType.Name.Contains("ApplicationDbContext"))
                .ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            // Đăng ký lại ApplicationDbContext với InMemory database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("InMemoryDbForTesting");
            });

            // Re-register IApplicationDbContext
            services.AddScoped<IApplicationDbContext>(provider =>
                provider.GetRequiredService<ApplicationDbContext>());
        });
    }
}
