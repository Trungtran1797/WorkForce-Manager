using MediatR;
using WorkForceManager.Application.Features.Auth.Common;

namespace WorkForceManager.Application.Features.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery : IRequest<AuthUserDto>;
