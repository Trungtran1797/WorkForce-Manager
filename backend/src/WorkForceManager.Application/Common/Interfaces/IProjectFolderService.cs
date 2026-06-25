namespace WorkForceManager.Application.Common.Interfaces;

public interface IProjectFolderService
{
    /// <summary>
    /// Tạo cây thư mục OneDrive chuẩn cho dự án mới (01–06 subfolder).
    /// Không throw nếu OneDrive chưa cấu hình.
    /// </summary>
    Task CreateProjectFolderAsync(string projectCode, string projectName);

    /// <summary>
    /// Trả về đường dẫn tuyệt đối tới thư mục "03 - Tai Lieu Thuc Hien\Dinh Kem"
    /// của dự án có mã <paramref name="projectCode"/>.
    /// Trả về null nếu OneDrive chưa cấu hình hoặc thư mục dự án chưa tồn tại.
    /// </summary>
    string? ResolveAttachmentPath(string projectCode);
}
