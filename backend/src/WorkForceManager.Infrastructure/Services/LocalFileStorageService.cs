using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Services;

/// <summary>
/// Lưu trữ file đính kèm trên local disk dưới {ContentRootPath}/wwwroot/uploads/{subFolder}/.
/// Production có thể thay bằng implementation Azure Blob/S3 mà không đổi Application layer.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".zip"
    };

    private readonly IHostEnvironment _hostEnvironment;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IHostEnvironment hostEnvironment, ILogger<LocalFileStorageService> logger)
    {
        _hostEnvironment = hostEnvironment;
        _logger = logger;
    }

    public async Task<(string StoredFileName, long SizeBytes)> SaveFileAsync(
        Stream content, string originalFileName, string contentType, string subFolder, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(
                    "Files",
                    $"Loại file \"{extension}\" không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", AllowedExtensions)}.")
            });
        }

        if (content.Length > MaxFileSizeBytes)
        {
            throw new ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(
                    "Files",
                    $"File \"{originalFileName}\" vượt quá kích thước tối đa cho phép (10MB).")
            });
        }

        var sanitizedFileName = SanitizeFileName(originalFileName);
        var storedFileName = $"{Guid.NewGuid()}_{sanitizedFileName}";

        var folderPath = GetFolderPath(subFolder);
        Directory.CreateDirectory(folderPath);

        var filePath = Path.Combine(folderPath, storedFileName);

        content.Position = 0;
        using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(fileStream, cancellationToken);
        }

        _logger.LogInformation("Đã lưu file {StoredFileName} ({SizeBytes} bytes) vào {SubFolder}",
            storedFileName, content.Length, subFolder);

        return (storedFileName, content.Length);
    }

    public Task<(Stream Content, string ContentType, string FileName)> GetFileAsync(
        string storedFileName, string subFolder, CancellationToken cancellationToken)
    {
        var filePath = Path.Combine(GetFolderPath(subFolder), storedFileName);

        if (!File.Exists(filePath))
        {
            throw new NotFoundException("File", storedFileName);
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<(Stream Content, string ContentType, string FileName)>(
            (stream, "application/octet-stream", storedFileName));
    }

    public void DeleteFile(string storedFileName, string subFolder)
    {
        var filePath = Path.Combine(GetFolderPath(subFolder), storedFileName);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("Đã xóa file {StoredFileName} khỏi {SubFolder}", storedFileName, subFolder);
        }
    }

    private string GetFolderPath(string subFolder) =>
        Path.Combine(_hostEnvironment.ContentRootPath, "wwwroot", "uploads", subFolder);

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(name.Select(c => invalidChars.Contains(c) ? '_' : c).ToArray());
        return sanitized.Length > 200 ? sanitized[^200..] : sanitized;
    }
}
