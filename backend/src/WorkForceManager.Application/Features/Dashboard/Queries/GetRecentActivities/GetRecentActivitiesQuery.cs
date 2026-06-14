using MediatR;
using WorkForceManager.Application.Features.Dashboard.Common;

namespace WorkForceManager.Application.Features.Dashboard.Queries.GetRecentActivities;

public record GetRecentActivitiesQuery : IRequest<List<RecentActivityDto>>;
