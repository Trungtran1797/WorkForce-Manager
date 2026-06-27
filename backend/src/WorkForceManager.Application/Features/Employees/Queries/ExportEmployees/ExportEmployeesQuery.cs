namespace WorkForceManager.Application.Features.Employees.Queries.ExportEmployees;

using MediatR;

public record ExportEmployeesQuery(bool TemplateOnly = false) : IRequest<ExportEmployeesResultDto>;

public record ExportEmployeesResultDto(string FileName, string ContentType, byte[] FileContents);
