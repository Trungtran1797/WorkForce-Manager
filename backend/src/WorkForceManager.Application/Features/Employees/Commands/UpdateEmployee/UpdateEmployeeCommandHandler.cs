using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Commands.UpdateEmployee;

public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateEmployeeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeDto> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.Id);

        var code = request.EmployeeCode.Trim();
        var email = request.Email.Trim();

        if (await _context.Employees.AnyAsync(e => e.EmployeeCode == code && e.Id != request.Id, cancellationToken))
        {
            throw new ConflictException("Mã nhân viên đã tồn tại.");
        }
        if (await _context.Employees.AnyAsync(e => e.Email == email && e.Id != request.Id, cancellationToken))
        {
            throw new ConflictException("Email đã tồn tại.");
        }

        if (employee.DepartmentId != request.DepartmentId
            && !await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId, cancellationToken))
        {
            throw new NotFoundException("Phòng ban", request.DepartmentId);
        }

        employee.EmployeeCode = code;
        employee.FullName = request.FullName.Trim();
        employee.DateOfBirth = DateTime.Parse(request.DateOfBirth);
        employee.Gender = Enum.Parse<Gender>(request.Gender);
        employee.IdCardNumber = request.IdCardNumber.Trim();
        employee.PhoneNumber = request.PhoneNumber.Trim();
        employee.Email = email;
        employee.Address = request.Address?.Trim();
        employee.DepartmentId = request.DepartmentId;
        employee.Position = request.Position.Trim();
        employee.HireDate = DateTime.Parse(request.HireDate);
        employee.Status = Enum.Parse<EmployeeStatus>(request.Status);

        await _context.SaveChangesAsync(cancellationToken);

        var deptName = await _context.Departments
            .Where(d => d.Id == employee.DepartmentId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync(cancellationToken);
        employee.Department = null;

        var dto = employee.ToDto();
        return dto with { DepartmentName = deptName ?? string.Empty };
    }
}
