using MediatR;

namespace WorkForceManager.Application.Features.Users.Commands.UpdateUserStatus;

public record UpdateUserStatusCommand(int Id, bool IsActive) : IRequest;
