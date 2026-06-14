using MediatR;
using WorkForceManager.Application.Features.Search.Common;

namespace WorkForceManager.Application.Features.Search.Queries.GlobalSearch;

public class GlobalSearchQuery : IRequest<GlobalSearchResultDto>
{
    public string Keyword { get; set; } = string.Empty;
}
