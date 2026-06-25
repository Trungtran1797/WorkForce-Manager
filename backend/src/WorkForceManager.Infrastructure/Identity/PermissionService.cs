using System.Threading;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity;

/// <summary>
/// Đọc ma trận phân quyền (RolePermissions + DepartmentPermissionOverrides) từ DB,
/// tính effective = max(role-level, department-override-level) và cache kết quả theo
/// (role, departmentId, generation) - "generation" tăng lên mỗi khi <see cref="InvalidateCache"/>
/// được gọi để vô hiệu hóa toàn bộ cache mà không cần lưu danh sách key.
/// </summary>
public class PermissionService : IPermissionService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private static int _cacheGeneration;

    public PermissionService(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<Dictionary<PermissionModule, PermissionLevel>> GetEffectivePermissionsAsync(
        UserRole role, int? departmentId, CancellationToken cancellationToken)
    {
        var cacheKey = $"perm:{Volatile.Read(ref _cacheGeneration)}:{role}:{departmentId}";

        if (_cache.TryGetValue(cacheKey, out Dictionary<PermissionModule, PermissionLevel>? cached) && cached is not null)
        {
            return cached;
        }

        var result = await BuildEffectivePermissionsAsync(role, departmentId, cancellationToken);

        _cache.Set(cacheKey, result, CacheTtl);

        return result;
    }

    public async Task<PermissionLevel> GetEffectiveLevelAsync(
        UserRole role, int? departmentId, PermissionModule module, CancellationToken cancellationToken)
    {
        var permissions = await GetEffectivePermissionsAsync(role, departmentId, cancellationToken);

        return permissions.TryGetValue(module, out var level) ? level : PermissionLevel.None;
    }

    public void InvalidateCache()
    {
        Interlocked.Increment(ref _cacheGeneration);
    }

    private async Task<Dictionary<PermissionModule, PermissionLevel>> BuildEffectivePermissionsAsync(
        UserRole role, int? departmentId, CancellationToken cancellationToken)
    {
        var allModules = Enum.GetValues<PermissionModule>();

        // Super Admin luôn có Edit trên mọi module - không cần truy vấn DB.
        if (role == UserRole.SuperAdmin)
        {
            return allModules.ToDictionary(module => module, _ => PermissionLevel.Edit);
        }

        var rolePermissions = await _context.RolePermissions
            .AsNoTracking()
            .Where(rp => rp.Role == role)
            .ToListAsync(cancellationToken);

        var effective = allModules.ToDictionary(module => module, _ => PermissionLevel.None);

        foreach (var rolePermission in rolePermissions)
        {
            effective[rolePermission.Module] = rolePermission.Level;
        }

        if (departmentId.HasValue)
        {
            var overrides = await _context.DepartmentPermissionOverrides
                .AsNoTracking()
                .Where(o => o.DepartmentId == departmentId.Value)
                .ToListAsync(cancellationToken);

            foreach (var @override in overrides)
            {
                var current = effective[@override.Module];
                effective[@override.Module] = (PermissionLevel)Math.Max((int)current, (int)@override.Level);
            }
        }

        return effective;
    }
}
