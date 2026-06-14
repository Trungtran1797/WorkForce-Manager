using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.SalaryConfigs.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.SalaryConfigs.Commands.SaveSalaryConfig;

public class SaveSalaryConfigCommandHandler : IRequestHandler<SaveSalaryConfigCommand, SalaryConfigDto>
{
    private readonly IApplicationDbContext _context;

    public SaveSalaryConfigCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SalaryConfigDto> Handle(SaveSalaryConfigCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.EmployeeId);

        var config = await _context.SalaryConfigs
            .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId, cancellationToken);

        if (config == null)
        {
            config = new SalaryConfig { EmployeeId = request.EmployeeId };
            _context.SalaryConfigs.Add(config);
        }

        config.BaseSalary = request.BaseSalary;
        config.Allowance = request.Allowance;
        config.InsuranceSalary = request.InsuranceSalary;
        config.DependentCount = request.DependentCount;

        await _context.SaveChangesAsync(cancellationToken);

        config.Employee = employee;
        return config.ToDto();
    }
}
