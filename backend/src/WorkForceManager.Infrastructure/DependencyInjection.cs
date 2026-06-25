using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Infrastructure.Identity;
using WorkForceManager.Infrastructure.Identity.Authorization;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using WorkForceManager.Infrastructure.Persistence.Repositories;
using WorkForceManager.Infrastructure.Services;

namespace WorkForceManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' chưa được cấu hình.");

        var dbProvider = configuration["DatabaseProvider"] ?? "SqlServer";
        var isSqlite = dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) ||
                       connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);

        services.AddScoped<AuditableEntitySaveChangesInterceptor>();

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (isSqlite)
            {
                options.UseSqlite(connectionString);
            }
            else
            {
                options.UseSqlServer(connectionString, sql =>
                    sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
            }
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IDateTimeService, DateTimeService>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        services.AddScoped<INotificationService, Notifications.NotificationService>();
        services.AddScoped<IEmailService, LoggingEmailService>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        // OneDrivePathSettings: singleton giữ đường dẫn hiện tại, khởi tạo từ config, ghi đè từ DB
        services.AddSingleton<OneDrivePathSettings>();
        services.AddSingleton<IProjectFolderService, ProjectFolderService>();

        // Watcher đăng ký làm singleton để IProjectFolderWatcherService có thể inject vào handler
        services.AddSingleton<ProjectFolderWatcherService>();
        services.AddSingleton<IProjectFolderWatcherService>(sp => sp.GetRequiredService<ProjectFolderWatcherService>());
        services.AddHostedService(sp => sp.GetRequiredService<ProjectFolderWatcherService>());

        services.AddMemoryCache();
        services.AddScoped<IPermissionService, PermissionService>();

        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

        return services;
    }
}

