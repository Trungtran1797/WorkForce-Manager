using MediatR;

namespace WorkForceManager.Application.Features.Okrs.Commands.DeleteObjective;

public record DeleteObjectiveCommand(int Id) : IRequest<Unit>;
