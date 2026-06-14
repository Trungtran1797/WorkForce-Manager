using MediatR;

namespace WorkForceManager.Application.Features.Departments.Commands.DeleteDepartment;

public record DeleteDepartmentCommand(int Id) : IRequest<Unit>;
