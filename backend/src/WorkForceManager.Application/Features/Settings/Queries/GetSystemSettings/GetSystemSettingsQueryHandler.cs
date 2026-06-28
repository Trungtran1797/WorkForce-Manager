using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Settings.Queries.GetSystemSettings;

public class GetSystemSettingsQueryHandler : IRequestHandler<GetSystemSettingsQuery, List<SystemSettingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SystemSettingDto>> Handle(GetSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings
            .AsNoTracking()
            .OrderBy(s => s.Key)
            .ToListAsync(cancellationToken);

        return settings.Select(s => new SystemSettingDto(
            s.Key,
            s.Key == "AiApiKey" && !string.IsNullOrEmpty(s.Value) ? "••••••••••••" : s.Value,
            s.Description,
            s.UpdatedDate,
            s.UpdatedBy
        )).ToList();
    }
}
