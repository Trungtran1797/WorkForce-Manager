namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>
/// Cho phép restart FileSystemWatcher khi admin thay đổi đường dẫn OneDrive qua UI.
/// </summary>
public interface IProjectFolderWatcherService
{
    Task RestartAsync(string newPath, CancellationToken cancellationToken = default);
}
