using MediatR;
using WorkForceManager.Application.Features.Overtime.Common;

namespace WorkForceManager.Application.Features.Overtime.Queries.GetMyOvertime;

public record GetMyOvertimeQuery : IRequest<List<OvertimeRequestDto>>;
