using MediatR;
using WorkForceManager.Application.Features.Dashboard.Common;

namespace WorkForceManager.Application.Features.Dashboard.Queries.GetWeeklyProgress;

public record GetWeeklyProgressQuery : IRequest<List<WeeklyProgressDto>>;
