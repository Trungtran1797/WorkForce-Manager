using MediatR;
using WorkForceManager.Application.Features.Departments.Common;

namespace WorkForceManager.Application.Features.Departments.Queries.GetDepartments;

public record GetDepartmentsQuery(string? Search) : IRequest<List<DepartmentDto>>;
