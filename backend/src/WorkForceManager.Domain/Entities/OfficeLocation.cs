using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>
/// Địa điểm hợp lệ để check-in: theo dải IP Wi-Fi văn phòng hoặc tọa độ GPS công trường.
/// Một địa điểm có thể ràng buộc theo IP, theo GPS, hoặc cả hai.
/// </summary>
public class OfficeLocation : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Danh sách dải/địa chỉ IP cho phép, phân tách bằng dấu phẩy (vd. "203.113.1.0/24,118.69.0.1").</summary>
    public string? AllowedIpRanges { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    /// <summary>Bán kính cho phép quanh tọa độ (mét). Null/0 = không ràng buộc GPS.</summary>
    public int RadiusMeters { get; set; }

    public bool IsActive { get; set; } = true;
}
