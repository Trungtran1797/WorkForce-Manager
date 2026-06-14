using MediatR;
using WorkForceManager.Application.Features.OfficeLocations.Common;

namespace WorkForceManager.Application.Features.OfficeLocations.Commands.SaveOfficeLocation;

/// <summary>Tạo mới (Id = 0) hoặc cập nhật (Id &gt; 0) một địa điểm check-in hợp lệ.</summary>
public record SaveOfficeLocationCommand(
    int Id,
    string Name,
    string? AllowedIpRanges,
    double? Latitude,
    double? Longitude,
    int RadiusMeters,
    bool IsActive) : IRequest<OfficeLocationDto>;
