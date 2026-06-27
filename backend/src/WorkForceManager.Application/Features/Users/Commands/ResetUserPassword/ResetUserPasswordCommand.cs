using MediatR;

namespace WorkForceManager.Application.Features.Users.Commands.ResetUserPassword;

public record ResetUserPasswordCommand(int Id, string NewPassword) : IRequest;
