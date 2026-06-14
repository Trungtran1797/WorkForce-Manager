namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>
/// Abstraction lưu trữ file đính kèm (Infrastructure implement bằng local disk storage,
/// có thể thay bằng Azure Blob/S3 trong tương lai mà không đổi Application layer).
/// </summary>
public interface IFileStorageService
{
    /// <summary>Lưu file vào storage, trả về tên file đã lưu (duy nhất) và kích thước (bytes).</summary>
    Task<(string StoredFileName, long SizeBytes)> SaveFileAsync(
        Stream content, string originalFileName, string contentType, string subFolder, CancellationToken cancellationToken);

    /// <summary>Đọc file từ storage để trả về cho client.</summary>
    Task<(Stream Content, string ContentType, string FileName)> GetFileAsync(
        string storedFileName, string subFolder, CancellationToken cancellationToken);

    /// <summary>Xóa file vật lý khỏi storage (không throw nếu file không tồn tại).</summary>
    void DeleteFile(string storedFileName, string subFolder);
}
