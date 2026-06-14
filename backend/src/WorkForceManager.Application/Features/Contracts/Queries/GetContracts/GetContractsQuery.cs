using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Contracts.Common;

namespace WorkForceManager.Application.Features.Contracts.Queries.GetContracts;

public class GetContractsQuery : PaginationRequest, IRequest<PaginatedList<ContractDto>>
{
    public int? EmployeeId { get; set; }
    public string? Status { get; set; }
}
