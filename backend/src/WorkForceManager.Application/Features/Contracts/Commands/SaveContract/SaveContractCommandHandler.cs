using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Contracts.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Contracts.Commands.SaveContract;

public class SaveContractCommandHandler : IRequestHandler<SaveContractCommand, ContractDto>
{
    private readonly IApplicationDbContext _context;

    public SaveContractCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ContractDto> Handle(SaveContractCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.EmployeeId);

        var code = request.ContractCode.Trim();
        if (await _context.EmploymentContracts.AnyAsync(c => c.ContractCode == code && c.Id != request.Id, cancellationToken))
        {
            throw new ConflictException($"Mã hợp đồng '{code}' đã tồn tại.");
        }

        EmploymentContract contract;
        if (request.Id > 0)
        {
            contract = await _context.EmploymentContracts
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException("Hợp đồng", request.Id);
        }
        else
        {
            contract = new EmploymentContract();
            _context.EmploymentContracts.Add(contract);
        }

        contract.EmployeeId = request.EmployeeId;
        contract.ContractCode = code;
        contract.ContractType = Enum.Parse<ContractType>(request.ContractType);
        contract.StartDate = DateTime.Parse(request.StartDate).Date;
        contract.EndDate = string.IsNullOrWhiteSpace(request.EndDate) ? null : DateTime.Parse(request.EndDate).Date;
        contract.BaseSalary = request.BaseSalary;
        contract.Allowance = request.Allowance;
        contract.InsuranceSalary = request.InsuranceSalary;
        contract.Status = Enum.Parse<ContractStatus>(request.Status);
        contract.FileUrl = request.FileUrl;
        contract.ParentContractId = request.ParentContractId;

        await _context.SaveChangesAsync(cancellationToken);

        contract.Employee = employee;
        return contract.ToDto();
    }
}
