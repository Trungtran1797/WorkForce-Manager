using MediatR;
using WorkForceManager.Application.Features.OfficeLocations.Common;

namespace WorkForceManager.Application.Features.OfficeLocations.Queries.GetOfficeLocations;

public record GetOfficeLocationsQuery : IRequest<List<OfficeLocationDto>>;
