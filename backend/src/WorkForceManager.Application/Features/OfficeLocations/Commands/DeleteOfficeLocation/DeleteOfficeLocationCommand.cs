using MediatR;

namespace WorkForceManager.Application.Features.OfficeLocations.Commands.DeleteOfficeLocation;

public record DeleteOfficeLocationCommand(int Id) : IRequest<Unit>;
