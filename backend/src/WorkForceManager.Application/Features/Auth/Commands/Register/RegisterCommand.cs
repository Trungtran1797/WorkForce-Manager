using MediatR;
using WorkForceManager.Application.Features.Auth.Common;

namespace WorkForceManager.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string Email,
    string Password,
    string Role,
    int? EmployeeId) : IRequest<AuthUserDto>;
