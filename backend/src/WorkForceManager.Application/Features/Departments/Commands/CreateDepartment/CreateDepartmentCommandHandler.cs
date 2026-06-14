using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Departments.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Departments.Commands.CreateDepartment;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, DepartmentDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateDepartmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DepartmentDto> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = new Department
        {
            Name = request.Name.Trim(),
            ManagerId = request.ManagerId,
            Description = request.Description?.Trim(),
            Icon = request.Icon,
            ColorVariant = request.ColorVariant,
            ParentDepartmentId = request.ParentDepartmentId
        };

        await _unitOfWork.Repository<Department>().AddAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string? parentDepartmentName = null;
        if (department.ParentDepartmentId is { } parentId)
        {
            parentDepartmentName = await _unitOfWork.Repository<Department>()
                .Query()
                .Where(d => d.Id == parentId)
                .Select(d => d.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new DepartmentDto(
            department.Id, department.Name, department.ManagerId, string.Empty, 0,
            department.Description ?? string.Empty, department.Icon, department.ColorVariant,
            department.ParentDepartmentId, parentDepartmentName);
    }
}
