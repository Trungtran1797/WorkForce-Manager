using MediatR;

namespace WorkForceManager.Application.Features.Shifts.Commands.DeleteShift;

public record DeleteShiftCommand(int Id) : IRequest<Unit>;
