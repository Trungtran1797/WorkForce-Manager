using MediatR;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Queries.GetMyAttendance;

public record GetMyAttendanceQuery : IRequest<List<AttendanceDto>>;
