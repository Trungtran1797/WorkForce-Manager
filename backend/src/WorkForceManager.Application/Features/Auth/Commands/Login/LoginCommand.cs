using MediatR;
using WorkForceManager.Application.Features.Auth.Common;

namespace WorkForceManager.Application.Features.Auth.Commands.Login;

public record LoginCommand(string UserNameOrEmail, string Password) : IRequest<AuthResponse>;
