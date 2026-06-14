using FluentAssertions;
using WorkForceManager.Application.Common.Helpers;
using WorkForceManager.Domain.Entities;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class LocationValidatorTests
{
    [Fact]
    public void IsCheckInAllowed_ShouldAllow_WhenNoActiveLocationsConfigured()
    {
        var locations = new List<OfficeLocation>
        {
            new() { Name = "Trụ sở", AllowedIpRanges = "10.0.0.0/8", IsActive = false }
        };

        var result = LocationValidator.IsCheckInAllowed(locations, "203.0.113.5", null, null);

        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("192.168.1.50", true)]
    [InlineData("192.168.255.1", true)]
    [InlineData("10.10.10.10", false)]
    public void IsCheckInAllowed_ShouldMatchCidrRange(string ip, bool expected)
    {
        var locations = new List<OfficeLocation>
        {
            new() { Name = "Văn phòng", AllowedIpRanges = "192.168.0.0/16", IsActive = true }
        };

        var result = LocationValidator.IsCheckInAllowed(locations, ip, null, null);

        result.Should().Be(expected);
    }

    [Fact]
    public void IsCheckInAllowed_ShouldAllow_WhenGpsWithinRadius()
    {
        var locations = new List<OfficeLocation>
        {
            new() { Name = "Công trường", Latitude = 21.028511, Longitude = 105.804817, RadiusMeters = 300, IsActive = true }
        };

        // Cách tâm ~50m.
        var result = LocationValidator.IsCheckInAllowed(locations, null, 21.028900, 105.804900);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsCheckInAllowed_ShouldReject_WhenGpsOutsideRadiusAndIpNotMatch()
    {
        var locations = new List<OfficeLocation>
        {
            new() { Name = "Công trường", Latitude = 21.028511, Longitude = 105.804817, RadiusMeters = 100, IsActive = true }
        };

        // Cách tâm vài km.
        var result = LocationValidator.IsCheckInAllowed(locations, "8.8.8.8", 21.10, 105.90);

        result.Should().BeFalse();
    }

    [Fact]
    public void HaversineMeters_ShouldComputeKnownDistance()
    {
        // ~111km giữa 2 vĩ độ chênh 1 độ.
        var distance = LocationValidator.HaversineMeters(21.0, 105.0, 22.0, 105.0);

        distance.Should().BeApproximately(111_000, 2_000);
    }
}
