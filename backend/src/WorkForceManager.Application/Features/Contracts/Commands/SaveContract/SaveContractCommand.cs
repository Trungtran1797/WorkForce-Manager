using MediatR;
using WorkForceManager.Application.Features.Contracts.Common;

namespace WorkForceManager.Application.Features.Contracts.Commands.SaveContract;

/// <summary>Tạo mới (Id = 0) hoặc cập nhật (Id &gt; 0) hợp đồng lao động.</summary>
public record SaveContractCommand(
    int Id,
    int EmployeeId,
    string ContractCode,
    string ContractType,
    string StartDate,
    string? EndDate,
    decimal BaseSalary,
    decimal Allowance,
    decimal InsuranceSalary,
    string Status,
    string? FileUrl,
    int? ParentContractId) : IRequest<ContractDto>;
