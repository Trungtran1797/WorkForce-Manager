using MediatR;
using Microsoft.AspNetCore.Http;

namespace WorkForceManager.Application.Features.Employees.Commands.ImportEmployees;

public record ImportEmployeesCommand(IFormFile File) : IRequest<ImportEmployeesResultDto>;
