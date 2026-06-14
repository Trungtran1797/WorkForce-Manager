using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Employees.Common;

namespace WorkForceManager.Application.Features.Employees.Queries.GetEmployees;

public class GetEmployeesQuery : PaginationRequest, IRequest<PaginatedList<EmployeeDto>>
{
    public int? DepartmentId { get; set; }
    public string? Status { get; set; }
}
