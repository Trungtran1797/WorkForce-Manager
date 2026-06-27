using System.Collections.Generic;

namespace WorkForceManager.Application.Features.Employees.Commands.ImportEmployees;

public class ImportEmployeesResultDto
{
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
