using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.OfficeLocations.Common;

public record OfficeLocationDto(
    int Id,
    string Name,
    string? AllowedIpRanges,
    double? Latitude,
    double? Longitude,
    int RadiusMeters,
    bool IsActive);

public static class OfficeLocationMapping
{
    public static OfficeLocationDto ToDto(this OfficeLocation l) => new(
        l.Id,
        l.Name,
        l.AllowedIpRanges,
        l.Latitude,
        l.Longitude,
        l.RadiusMeters,
        l.IsActive);
}
