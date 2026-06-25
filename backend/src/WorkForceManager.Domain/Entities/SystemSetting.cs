namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Cấu hình hệ thống dạng key-value, lưu vào DB để admin có thể cập nhật qua UI mà không cần restart.
/// </summary>
public class SystemSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }
}
