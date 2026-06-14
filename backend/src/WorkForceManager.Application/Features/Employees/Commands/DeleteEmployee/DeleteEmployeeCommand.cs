using MediatR;

namespace WorkForceManager.Application.Features.Employees.Commands.DeleteEmployee;

public record DeleteEmployeeCommand(int Id) : IRequest<Unit>;
