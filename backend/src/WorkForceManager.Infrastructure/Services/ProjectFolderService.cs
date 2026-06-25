using System.Globalization;
using System.Text;
using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Services;

public class ProjectFolderService : IProjectFolderService
{
    private const string AttachmentSubPath = "03 - Tai Lieu Thuc Hien\\Dinh Kem";

    private static readonly string[] ProjectSubFolders =
    [
        "01 - Tai Lieu Khoi Dong",
        "02 - Ke Hoach",
        "03 - Tai Lieu Thuc Hien",
        "03 - Tai Lieu Thuc Hien\\Dinh Kem",
        "04 - Hop Dong - Phap Ly",
        "05 - Tai Lieu Ban Giao",
        "06 - Luu Tru"
    ];

    private readonly OneDrivePathSettings _pathSettings;
    private readonly ILogger<ProjectFolderService> _logger;

    public ProjectFolderService(OneDrivePathSettings pathSettings, ILogger<ProjectFolderService> logger)
    {
        _pathSettings = pathSettings;
        _logger = logger;
    }

    public Task CreateProjectFolderAsync(string projectCode, string projectName)
    {
        var basePath = _pathSettings.ProjectsBasePath;
        if (string.IsNullOrWhiteSpace(basePath))
        {
            _logger.LogDebug("OneDriveProjectsBasePath chưa cấu hình — bỏ qua tạo thư mục dự án.");
            return Task.CompletedTask;
        }

        try
        {
            var folderName = BuildFolderName(projectCode, projectName);
            var projectPath = Path.Combine(basePath, folderName);

            foreach (var sub in ProjectSubFolders)
            {
                Directory.CreateDirectory(Path.Combine(projectPath, sub));
            }

            _logger.LogInformation("Đã tạo thư mục dự án OneDrive: {Path}", projectPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể tạo thư mục OneDrive cho dự án {Code}", projectCode);
        }

        return Task.CompletedTask;
    }

    public string? ResolveAttachmentPath(string projectCode)
    {
        var basePath = _pathSettings.ProjectsBasePath;
        if (string.IsNullOrWhiteSpace(basePath) || !Directory.Exists(basePath))
            return null;

        try
        {
            var match = Directory
                .GetDirectories(basePath, $"{projectCode} - *", SearchOption.TopDirectoryOnly)
                .FirstOrDefault();

            if (match is null) return null;

            var attachPath = Path.Combine(match, AttachmentSubPath);
            Directory.CreateDirectory(attachPath);
            return attachPath;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể resolve thư mục đính kèm cho dự án {Code}", projectCode);
            return null;
        }
    }

    internal static string BuildFolderName(string projectCode, string projectName)
    {
        return $"{projectCode} - {ToNoAccentTitleCase(projectName)}";
    }

    private static string ToNoAccentTitleCase(string text)
    {
        text = text.Replace("đ", "d").Replace("Đ", "D");

        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var plain = sb.ToString().Normalize(NormalizationForm.FormC);

        return string.Join(" ",
            plain.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                 .Select(w => char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant()));
    }
}
