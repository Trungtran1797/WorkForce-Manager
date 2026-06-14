using MediatR;
using WorkForceManager.Application.Features.Auth.Common;

namespace WorkForceManager.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;
