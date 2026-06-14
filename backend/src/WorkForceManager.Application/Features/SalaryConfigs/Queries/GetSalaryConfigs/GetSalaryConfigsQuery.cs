using MediatR;
using WorkForceManager.Application.Features.SalaryConfigs.Common;

namespace WorkForceManager.Application.Features.SalaryConfigs.Queries.GetSalaryConfigs;

public record GetSalaryConfigsQuery : IRequest<List<SalaryConfigDto>>;
