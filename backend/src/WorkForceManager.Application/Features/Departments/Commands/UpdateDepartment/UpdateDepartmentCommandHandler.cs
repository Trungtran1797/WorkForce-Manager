using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Departments.Common;

namespace WorkForceManager.Application.Features.Departments.Commands.UpdateDepartment;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, DepartmentDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDto> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Phòng ban", request.Id);

        department.Name = request.Name.Trim();
        department.ManagerId = request.ManagerId;
        department.Description = request.Description?.Trim();
        department.Icon = request.Icon;
        department.ColorVariant = request.ColorVariant;
        department.ParentDepartmentId = request.ParentDepartmentId;

        await _context.SaveChangesAsync(cancellationToken);

        var managerName = department.ManagerId is null
            ? string.Empty
            : await _context.Employees
                .Where(e => e.Id == department.ManagerId)
                .Select(e => e.FullName)
                .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var employeeCount = await _context.Employees
            .CountAsync(e => e.DepartmentId == department.Id, cancellationToken);

        var parentDepartmentName = department.ParentDepartmentId is null
            ? null
            : await _context.Departments
                .Where(d => d.Id == department.ParentDepartmentId)
                .Select(d => d.Name)
                .FirstOrDefaultAsync(cancellationToken);

        return new DepartmentDto(
            department.Id, department.Name, department.ManagerId, managerName, employeeCount,
            department.Description ?? string.Empty, department.Icon, department.ColorVariant,
            department.ParentDepartmentId, parentDepartmentName);
    }
}
