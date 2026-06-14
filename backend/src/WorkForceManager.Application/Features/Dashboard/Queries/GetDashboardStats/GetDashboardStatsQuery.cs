using MediatR;
using WorkForceManager.Application.Features.Dashboard.Common;

namespace WorkForceManager.Application.Features.Dashboard.Queries.GetDashboardStats;

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;
