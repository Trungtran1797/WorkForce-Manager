using MediatR;

namespace WorkForceManager.Application.Features.Users.Commands.UpdateUserRole;

public record UpdateUserRoleCommand(int Id, string Role) : IRequest;
