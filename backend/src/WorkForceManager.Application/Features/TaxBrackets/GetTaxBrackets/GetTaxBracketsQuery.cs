using MediatR;

namespace WorkForceManager.Application.Features.TaxBrackets.GetTaxBrackets;

public record TaxBracketDto(int Order, decimal FromAmount, decimal? ToAmount, decimal Rate);

public record GetTaxBracketsQuery : IRequest<List<TaxBracketDto>>;
