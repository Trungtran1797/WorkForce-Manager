using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Services;

public sealed class ProjectFolderWatcherService : BackgroundService, IProjectFolderWatcherService
{
    // Khớp: "DA005 - Mo Rong Thi Truong" hoặc "26-001 - Ten Du An"
    private static readonly Regex FolderPattern =
        new(@"^([A-Za-z0-9][A-Za-z0-9-]+) - (.+)$", RegexOptions.Compiled);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProjectFolderWatcherService> _logger;
    private readonly OneDrivePathSettings _pathSettings;

    // Debounce: tránh xử lý trùng khi FileSystemWatcher bắn nhiều event cho 1 thư mục
    private readonly ConcurrentDictionary<string, byte> _processing =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly SemaphoreSlim _watcherLock = new(1, 1);
    private FileSystemWatcher? _watcher;

    public ProjectFolderWatcherService(
        IServiceScopeFactory scopeFactory,
        ILogger<ProjectFolderWatcherService> logger,
        OneDrivePathSettings pathSettings)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _pathSettings = pathSettings;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Đọc path từ DB, ghi đè giá trị mặc định từ config
        var dbPath = await LoadPathFromDbAsync(stoppingToken);
        if (dbPath is not null)
            _pathSettings.ProjectsBasePath = dbPath;

        StartWatcher(_pathSettings.ProjectsBasePath);
        stoppingToken.Register(StopWatcher);
    }

    // IProjectFolderWatcherService: restart watcher khi admin thay đổi path qua UI
    public async Task RestartAsync(string newPath, CancellationToken cancellationToken = default)
    {
        await _watcherLock.WaitAsync(cancellationToken);
        try
        {
            _pathSettings.ProjectsBasePath = newPath;
            StopWatcher();
            StartWatcher(newPath);
        }
        finally
        {
            _watcherLock.Release();
        }
    }

    private void StartWatcher(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
        {
            _logger.LogWarning(
                "ProjectFolderWatcher: đường dẫn không tồn tại hoặc chưa cấu hình: '{Path}'. Watcher không khởi động.",
                path);
            return;
        }

        _watcher = new FileSystemWatcher(path)
        {
            NotifyFilter = NotifyFilters.DirectoryName,
            Filter = "*",
            IncludeSubdirectories = false,
            EnableRaisingEvents = true
        };

        _watcher.Created += OnCreated;
        _watcher.Error += OnError;
        _logger.LogInformation("ProjectFolderWatcher: đang theo dõi '{Path}'", path);
    }

    private void OnCreated(object sender, FileSystemEventArgs e)
    {
        if (!Directory.Exists(e.FullPath)) return;

        var folderName = Path.GetFileName(e.FullPath);
        var match = FolderPattern.Match(folderName);
        if (!match.Success) return;

        var code = match.Groups[1].Value.Trim().ToUpperInvariant();
        var name = match.Groups[2].Value.Trim();

        if (!_processing.TryAdd(code, 0)) return;

        _ = Task.Run(async () =>
        {
            try
            {
                // Chờ 1 giây để tránh race condition với CreateProjectCommandHandler
                // (tạo DB trước → tạo folder sau → watcher bắt được folder mới)
                await Task.Delay(1000);
                await HandleNewFolderAsync(code, name, folderName);
            }
            finally
            {
                _processing.TryRemove(code, out _);
            }
        });
    }

    private async Task HandleNewFolderAsync(string code, string name, string folderName)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            // IgnoreQueryFilters để bắt cả soft-deleted project cùng mã, tránh tạo trùng
            var exists = await context.Projects
                .IgnoreQueryFilters()
                .AnyAsync(p => p.Code == code);

            if (exists)
            {
                _logger.LogDebug(
                    "ProjectFolderWatcher: dự án [{Code}] đã có trong DB (kể cả đã xóa mềm), bỏ qua.", code);
                return;
            }

            var today = DateTime.Today;
            var project = new Project
            {
                Code = code,
                Name = name,
                StartDate = today,
                EndDate = today.AddYears(1),
                Status = ProjectStatus.Planning,
                Budget = 0,
                Progress = 0,
                Description = "Tự động tạo từ thư mục OneDrive"
            };

            context.Projects.Add(project);
            await context.SaveChangesAsync();

            _logger.LogInformation(
                "ProjectFolderWatcher: đã tạo dự án [{Code}] '{Name}' từ thư mục OneDrive.", code, name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "ProjectFolderWatcher: lỗi khi xử lý thư mục '{Folder}'", folderName);
        }
    }

    private async Task<string?> LoadPathFromDbAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var setting = await context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "OneDriveProjectsBasePath", cancellationToken);
            return setting is { Value.Length: > 0 } ? setting.Value : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ProjectFolderWatcher: không thể đọc path từ DB, dùng giá trị config.");
            return null;
        }
    }

    private void OnError(object sender, ErrorEventArgs e)
    {
        _logger.LogError(e.GetException(),
            "ProjectFolderWatcher: lỗi FileSystemWatcher. Restart service để khôi phục.");
    }

    private void StopWatcher()
    {
        if (_watcher is null) return;
        _watcher.EnableRaisingEvents = false;
        _watcher.Dispose();
        _watcher = null;
        _logger.LogInformation("ProjectFolderWatcher: đã dừng.");
    }

    public override void Dispose()
    {
        StopWatcher();
        _watcherLock.Dispose();
        base.Dispose();
    }
}
