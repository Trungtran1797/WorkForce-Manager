using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Common;

namespace WorkForceManager.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Tự động set audit fields (CreatedBy/Date, ModifiedBy/Date) và chuyển hard delete
/// thành soft delete cho mọi BaseAuditableEntity.
/// </summary>
public class AuditableEntitySaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeService _dateTime;

    public AuditableEntitySaveChangesInterceptor(
        ICurrentUserService currentUser, IDateTimeService dateTime)
    {
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var userName = _currentUser.UserName ?? "system";
        var now = _dateTime.UtcNow;

        foreach (EntityEntry<BaseAuditableEntity> entry in context.ChangeTracker.Entries<BaseAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = userName;
                    entry.Entity.CreatedDate = now;
                    break;

                case EntityState.Modified:
                    entry.Entity.ModifiedBy = userName;
                    entry.Entity.ModifiedDate = now;
                    break;

                case EntityState.Deleted:
                    // Soft delete: huỷ xoá thật, chuyển sang đánh dấu IsDeleted.
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedBy = userName;
                    entry.Entity.DeletedDate = now;
                    entry.Entity.ModifiedBy = userName;
                    entry.Entity.ModifiedDate = now;
                    break;
            }
        }
    }
}
