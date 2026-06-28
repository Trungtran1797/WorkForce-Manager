using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Settings.Commands.UpdateSystemSetting;

public class UpdateSystemSettingCommandHandler : IRequestHandler<UpdateSystemSettingCommand, ApiResponse<object>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IProjectFolderWatcherService? _watcherService;
    private readonly IEncryptionService _encryptionService;

    public UpdateSystemSettingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IEncryptionService encryptionService,
        IProjectFolderWatcherService? watcherService = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _encryptionService = encryptionService;
        _watcherService = watcherService;
    }

    public async Task<ApiResponse<object>> Handle(UpdateSystemSettingCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == request.Key, cancellationToken)
            ?? throw new NotFoundException("Cài đặt hệ thống", request.Key);

        if (request.Key == "AiApiKey")
        {
            if (request.Value == "••••••••••••")
            {
                return ApiResponse.Ok("Không có thay đổi nào cho AI API Key.");
            }
            setting.Value = !string.IsNullOrEmpty(request.Value) ? _encryptionService.Encrypt(request.Value.Trim()) : string.Empty;
        }
        else
        {
            setting.Value = request.Value.Trim();
        }

        setting.UpdatedDate = DateTime.UtcNow;
        setting.UpdatedBy = _currentUserService.UserName;

        await _context.SaveChangesAsync(cancellationToken);

        // Nếu đường dẫn OneDrive thay đổi → restart watcher với path mới
        if (request.Key == "OneDriveProjectsBasePath" && _watcherService is not null)
        {
            await _watcherService.RestartAsync(setting.Value, cancellationToken);
        }

        return ApiResponse.Ok("Đã cập nhật cài đặt hệ thống.");
    }
}
