using MediatR;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Commands.CheckIn;

public record CheckInCommand(
    string? Note,
    double? Latitude = null,
    double? Longitude = null) : IRequest<AttendanceDto>;
