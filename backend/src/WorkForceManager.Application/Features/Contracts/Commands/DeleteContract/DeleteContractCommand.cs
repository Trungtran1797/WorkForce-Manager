using MediatR;

namespace WorkForceManager.Application.Features.Contracts.Commands.DeleteContract;

public record DeleteContractCommand(int Id) : IRequest<Unit>;
