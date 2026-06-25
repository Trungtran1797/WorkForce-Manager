using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Settings.Queries.GetSystemSettings;

public record SystemSettingDto(string Key, string Value, string? Description, DateTime UpdatedDate, string? UpdatedBy);

public record GetSystemSettingsQuery : IRequest<List<SystemSettingDto>>;
