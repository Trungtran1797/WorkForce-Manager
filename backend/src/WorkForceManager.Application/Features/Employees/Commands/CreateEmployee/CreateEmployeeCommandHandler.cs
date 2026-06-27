using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;

    public CreateEmployeeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeDto> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var code = request.EmployeeCode.Trim();
        var email = request.Email.Trim();

        if (await _context.Employees.AnyAsync(e => e.EmployeeCode == code, cancellationToken))
        {
            throw new ConflictException("Mã nhân viên đã tồn tại.");
        }
        if (await _context.Employees.AnyAsync(e => e.Email == email, cancellationToken))
        {
            throw new ConflictException("Email đã tồn tại.");
        }

        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.DepartmentId, cancellationToken)
            ?? throw new NotFoundException("Phòng ban", request.DepartmentId);

        var employee = new Employee
        {
            EmployeeCode = code,
            FullName = request.FullName.Trim(),
            DateOfBirth = DateTime.Parse(request.DateOfBirth),
            Gender = Enum.Parse<Gender>(request.Gender),
            IdCardNumber = request.IdCardNumber.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Email = email,
            Address = request.Address?.Trim(),
            DepartmentId = request.DepartmentId,
            Position = request.Position.Trim(),
            HireDate = DateTime.Parse(request.HireDate),
            Status = Enum.Parse<EmployeeStatus>(request.Status),
            PlaceOfOrigin = request.PlaceOfOrigin?.Trim(),
            MaritalStatus = request.MaritalStatus?.Trim(),
            OneOfficeAccount = request.OneOfficeAccount?.Trim()
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        employee.Department = department;
        return employee.ToDto();
    }
}
