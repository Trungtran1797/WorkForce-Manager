using MediatR;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Settings.Commands.UpdateSystemSetting;

public record UpdateSystemSettingCommand(string Key, string Value) : IRequest<ApiResponse<object>>;
