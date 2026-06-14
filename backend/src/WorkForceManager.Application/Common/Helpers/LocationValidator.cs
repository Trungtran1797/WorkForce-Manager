using System.Net;
using System.Net.Sockets;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Common.Helpers;

/// <summary>
/// Kiểm tra check-in có nằm trong địa điểm hợp lệ không: theo dải IP Wi-Fi văn phòng
/// hoặc theo bán kính GPS quanh tọa độ công trường (công thức Haversine).
/// </summary>
public static class LocationValidator
{
    private const double EarthRadiusMeters = 6_371_000d;

    /// <summary>
    /// True nếu không cấu hình địa điểm nào (không ràng buộc) hoặc check-in khớp ít nhất một địa điểm.
    /// </summary>
    public static bool IsCheckInAllowed(
        IReadOnlyCollection<OfficeLocation> locations,
        string? ipAddress,
        double? latitude,
        double? longitude)
    {
        var activeLocations = locations.Where(l => l.IsActive).ToList();
        if (activeLocations.Count == 0)
        {
            return true; // Chưa cấu hình ràng buộc → cho phép.
        }

        foreach (var location in activeLocations)
        {
            if (MatchesIp(location.AllowedIpRanges, ipAddress))
            {
                return true;
            }

            if (MatchesGps(location, latitude, longitude))
            {
                return true;
            }
        }

        return false;
    }

    private static bool MatchesIp(string? allowedRanges, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(allowedRanges) || string.IsNullOrWhiteSpace(ipAddress))
        {
            return false;
        }

        if (!IPAddress.TryParse(ipAddress.Trim(), out var ip))
        {
            return false;
        }

        foreach (var rangeRaw in allowedRanges.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (rangeRaw.Contains('/'))
            {
                if (IsInCidr(ip, rangeRaw))
                {
                    return true;
                }
            }
            else if (IPAddress.TryParse(rangeRaw, out var single) && single.Equals(ip))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsInCidr(IPAddress ip, string cidr)
    {
        var parts = cidr.Split('/', 2);
        if (!IPAddress.TryParse(parts[0], out var network) || !int.TryParse(parts[1], out var prefixLength))
        {
            return false;
        }

        if (ip.AddressFamily != network.AddressFamily)
        {
            return false;
        }

        var ipBytes = ip.GetAddressBytes();
        var networkBytes = network.GetAddressBytes();
        var totalBits = ipBytes.Length * 8;
        if (prefixLength < 0 || prefixLength > totalBits)
        {
            return false;
        }

        var fullBytes = prefixLength / 8;
        for (var i = 0; i < fullBytes; i++)
        {
            if (ipBytes[i] != networkBytes[i])
            {
                return false;
            }
        }

        var remainingBits = prefixLength % 8;
        if (remainingBits == 0)
        {
            return true;
        }

        var mask = (byte)(0xFF << (8 - remainingBits));
        return (ipBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
    }

    private static bool MatchesGps(OfficeLocation location, double? latitude, double? longitude)
    {
        if (location.Latitude is not { } lat || location.Longitude is not { } lng
            || location.RadiusMeters <= 0
            || latitude is not { } checkInLat || longitude is not { } checkInLng)
        {
            return false;
        }

        return HaversineMeters(lat, lng, checkInLat, checkInLng) <= location.RadiusMeters;
    }

    /// <summary>Khoảng cách giữa hai tọa độ (mét) theo công thức Haversine.</summary>
    public static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
                * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusMeters * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180d;
}
