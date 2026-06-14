using MediatR;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Commands.CheckOut;

public record CheckOutCommand(string? Note) : IRequest<AttendanceDto>;
