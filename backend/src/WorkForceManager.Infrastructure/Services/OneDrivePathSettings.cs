using Microsoft.Extensions.Configuration;

namespace WorkForceManager.Infrastructure.Services;

/// <summary>
/// Singleton giữ đường dẫn OneDrive hiện tại. Khởi tạo từ config, ghi đè từ DB khi watcher start hoặc khi
/// admin cập nhật qua UI. Thread-safe nhờ volatile field.
/// </summary>
public sealed class OneDrivePathSettings
{
    private volatile string _projectsBasePath;

    public OneDrivePathSettings(IConfiguration configuration)
    {
        _projectsBasePath = configuration["OneDriveSettings:ProjectsBasePath"] ?? string.Empty;
    }

    public string ProjectsBasePath
    {
        get => _projectsBasePath;
        set => _projectsBasePath = value ?? string.Empty;
    }
}
